"""Tests for the `RefreshService` extraction (US2).

These tests are written FIRST (TDD per Constitution Principle III) and
fail until T019-T024 land. They use `CaptureQueriesContext` to assert the
per-feed statement budget documented in
`specs/003-db-optimization/contracts/sql-statement-budget.md`.
"""

from __future__ import annotations

from unittest.mock import patch

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest

from podcasts.models import Episode, Podcast
from podcasts.services.refresh_service import RefreshService
from podcasts.tests.factories import PodcastFactory


@pytest.mark.django_db
class TestRefreshServiceStatementBudget:
    def setup_method(self):
        self.podcast = PodcastFactory(name="Test Pod", feed="http://test.com/feed")

    def test_process_feed_50_items_under_60_statements(self):
        mock_items = [
            {
                "title": f"Ep {i}",
                "link": f"http://test.com/{i}",
                "published": "Fri, 01 Jan 2023 10:00:00 GMT",
                "description": "desc",
                "enclosure": f"http://audio.com/{i}.mp3",
                "tags": [f"tag-{i % 20}"],  # 20 unique tags
            }
            for i in range(50)
        ]

        with patch("podcasts.services.refresh_service.parse_feed") as mock_parse:
            mock_parse.return_value = {
                "title": "Test Pod",
                "language": "en",
                "image": "http://img.com",
                "items": mock_items,
            }
            with CaptureQueriesContext(connection) as ctx:
                result = RefreshService().process_feed("http://test.com/feed")

        # Budget (business-logic statements only; pytest-django adds
        # SAVEPOINT / RELEASE for the outer transaction.atomic and the
        # language get_or_create, so we filter them out):
        # 1 (podcast lookup) + 1 (language get) + 1 (language create) +
        # 1 (link preload) + 1 (tag resolve SELECT) +
        # 1 (missing-tag bulk_create) + 1 (tag reload SELECT) +
        # 1 (bulk_create episodes batch) +
        # 50 (one add per new episode) + 1 (image/language save) = 59
        assert result["episodes_added"] == 50
        real_queries = [
            q
            for q in ctx.captured_queries
            if not q["sql"]
            .lstrip()
            .startswith(("SAVEPOINT", "RELEASE", "ROLLBACK", "BEGIN", "COMMIT"))
        ]
        assert len(real_queries) <= 60, (
            f"per-feed business-logic statement count {len(real_queries)} "
            f"exceeds the 60 budget"
        )


@pytest.mark.django_db
class TestCounterResetIsOneStatement:
    def test_process_all_resets_total_episode_counters_in_one_statement(self):
        # Seed 5 podcasts with varying episode counts.
        podcasts = []
        for i in range(5):
            p = PodcastFactory(name=f"P{i}", feed=f"http://f{i}.com")
            for j in range(i + 1):
                Episode.objects.create(
                    podcast=p,
                    title=f"Ep {j}",
                    link=f"http://f{i}.com/{j}",
                )
            podcasts.append(p)

        with patch("podcasts.services.refresh_service.parse_feed") as mock_parse:
            mock_parse.return_value = {"items": []}  # no new episodes
            with CaptureQueriesContext(connection) as ctx:
                RefreshService().process_all()

        counter_resets = [
            q
            for q in ctx.captured_queries
            if "UPDATE podcasts_podcast" in q["sql"]
            and "SET total_episodes" in q["sql"]
        ]
        assert (
            len(counter_resets) == 1
        ), f"expected exactly one counter-reset statement, got {len(counter_resets)}"

        for p in podcasts:
            p.refresh_from_db()
            actual = Episode.objects.filter(podcast=p).count()
            assert (
                p.total_episodes == actual
            ), f"podcast {p.id} counter {p.total_episodes} != actual {actual}"


@pytest.mark.django_db
class TestRefreshServiceErrorHandling:
    def test_process_feed_rolls_back_on_parse_error(self):
        podcast = PodcastFactory(name="Test", feed="http://test.com/feed")
        with patch("podcasts.services.refresh_service.parse_feed") as mock_parse:
            mock_parse.side_effect = ValueError("boom")
            with CaptureQueriesContext(connection) as ctx:
                result = RefreshService().process_feed("http://test.com/feed")
        # No episode is created.
        assert Episode.objects.filter(podcast=podcast).count() == 0
        assert result["error"] is not None
        # The atomic block is rolled back; we still issued at most the
        # podcast-lookup statement before the parse. Filter out the
        # SAVEPOINT / RELEASE / ROLLBACK statements that pytest-django
        # adds around the test's outer transaction.
        real_queries = [
            q
            for q in ctx.captured_queries
            if not q["sql"]
            .lstrip()
            .startswith(("SAVEPOINT", "RELEASE", "ROLLBACK", "BEGIN", "COMMIT"))
        ]
        assert (
            len(real_queries) <= 1
        ), f"expected at most the podcast-lookup statement, got {len(real_queries)}: {real_queries}"

    def test_process_all_continues_after_per_feed_failure(self):
        PodcastFactory(name="Good", feed="http://good.com/feed")
        PodcastFactory(name="Bad", feed="http://bad.com/feed")

        boom_message = "boom"

        def parse_side_effect(url, *args, **kwargs):
            if "bad" in url:
                raise ValueError(boom_message)
            return {"items": [], "language": "en", "image": "http://img.com"}

        with patch(
            "podcasts.services.refresh_service.parse_feed",
            side_effect=parse_side_effect,
        ):
            results = RefreshService().process_all()

        assert len(results) == 2
        # Counter reset still ran once at the end.
        for p in Podcast.objects.all():
            p.refresh_from_db()
            assert p.total_episodes == 0
