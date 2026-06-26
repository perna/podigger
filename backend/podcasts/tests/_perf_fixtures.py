"""Reusable fixtures for performance tests in the podcasts app.

These helpers are intentionally isolated from `factories.py` so that the
production test factories stay small and the performance tests can take
their seeding time without slowing the rest of the suite.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from django.utils import timezone as dj_timezone

import pytest

from podcasts.models import Episode, Podcast, PodcastLanguage


class BulkSeedMixin:
    """Mixin-style helper that seeds a large catalogue via bulk_create.

    Used by the `make_large_catalogue` factory and by the slow performance
    tests. The seed is deterministic so CI runs are reproducible.
    """

    @staticmethod
    def seed_podcasts(count: int) -> list[Podcast]:
        """Create `count` Podcast rows in a single bulk_create call.

        Returns the list of persisted instances with their `id` set.
        """
        lang, _ = PodcastLanguage.objects.get_or_create(
            code="pt", defaults={"name": "português"}
        )
        podcasts = [
            Podcast(
                name=f"Bulk Podcast {i:05d}",
                feed=f"https://feeds.example.com/bulk-{i:05d}.xml",
                image=f"https://img.example.com/bulk-{i:05d}.jpg",
                language=lang,
            )
            for i in range(count)
        ]
        return Podcast.objects.bulk_create(podcasts, batch_size=500)

    @staticmethod
    def seed_episodes(
        podcast: Podcast, count: int, base_date: datetime | None = None
    ) -> list[Episode]:
        """Create `count` Episode rows for `podcast` in bulk.

        Episodes are spaced 1 hour apart, newest first, so the resulting
        dataset exercises both the `-published` ordering and the FTS index.
        """
        base = base_date or dj_timezone.now()
        episodes = [
            Episode(
                podcast=podcast,
                title=f"Episode {i:05d} of {podcast.name}",
                link=f"https://episodes.example.com/{podcast.id}-{i:05d}",
                description=(f"Description for episode {i} about python and django."),
                published=base - timedelta(hours=i),
                enclosure=f"https://audio.example.com/{podcast.id}-{i:05d}.mp3",
            )
            for i in range(count)
        ]
        return Episode.objects.bulk_create(episodes, batch_size=500)


@pytest.fixture
def bulk_seed():
    """Pytest fixture exposing the BulkSeedMixin helpers."""
    return BulkSeedMixin
