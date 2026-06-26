"""Slow performance test: assert p95 latency < 500 ms for the search endpoint.

The fixture is 200 podcasts x 100 episodes ≈ 20 000 episodes (Q2). The
test is marked `@pytest.mark.slow` so local dev can skip it; CI runs it.

Wall time is measured with `time.perf_counter`; the numpy-free quantile
function keeps the test free of new dependencies.
"""

from __future__ import annotations

import time

import pytest
from rest_framework.test import APIClient

from podcasts.tests.factories import make_large_catalogue


def _quantile(values: list[float], q: float) -> float:
    """Compute the q-th quantile of `values` (q in [0, 1]). No numpy needed."""
    if not values:
        return 0.0
    sorted_values = sorted(values)
    idx = max(0, min(len(sorted_values) - 1, int(q * (len(sorted_values) - 1))))
    return sorted_values[idx]


@pytest.mark.django_db(transaction=True)
@pytest.mark.slow
class TestSearchPerformance:
    """p95 latency of GET /api/episodes/?q=<term> < 500 ms (SC-001)."""

    def setup_method(self):
        # Seed 200 x 100 ≈ 20 000 episodes (Q2). This is slow on purpose.
        self.podcasts, self.episodes = make_large_catalogue(
            podcasts=200, episodes_per_podcast=100
        )
        self.client = APIClient()

    def test_p95_under_500ms_across_search_shapes(self):
        # Three query shapes: FTS hit, FTS miss + trigram hit, no `q` at all.
        queries = [
            "python",  # FTS should hit because the seed description contains it
            "pytohn",  # FTS miss → trigram fallback (typo of "python")
            "",  # no `q` → plain ordered list
        ]
        # Warm-up so we measure steady-state, not the first cold query.
        for q in queries:
            self.client.get(f"/api/episodes/?q={q}" if q else "/api/episodes/")

        samples: list[float] = []
        for _ in range(50):
            for q in queries:
                start = time.perf_counter()
                response = self.client.get(
                    f"/api/episodes/?q={q}" if q else "/api/episodes/"
                )
                elapsed_ms = (time.perf_counter() - start) * 1000
                assert response.status_code == 200
                samples.append(elapsed_ms)

        p95 = _quantile(samples, 0.95)
        assert p95 < 500, f"p95 latency {p95:.1f} ms exceeds the 500 ms budget"


@pytest.mark.django_db(transaction=True)
class TestSearchPerformanceSmoke:
    """Fast smoke test: p95 under 500 ms against a 1 000-episode sub-set.

    Used for local dev feedback; the full 20 000-episode test is in
    `TestSearchPerformance` above and is marked `@pytest.mark.slow`.
    """

    def test_p95_under_500ms_small_catalogue(self):
        _podcasts, _episodes = make_large_catalogue(
            podcasts=20, episodes_per_podcast=50
        )
        client = APIClient()
        # Warm-up
        client.get("/api/episodes/?q=python")
        samples: list[float] = []
        for _ in range(20):
            start = time.perf_counter()
            client.get("/api/episodes/?q=python")
            samples.append((time.perf_counter() - start) * 1000)
        p95 = _quantile(samples, 0.95)
        assert p95 < 500
