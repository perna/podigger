"""Tests for the `EpisodeUpdater` thin orchestrator (US2, Q5).

The per-feed work has been extracted into `RefreshService`; this module
covers the backward-compatibility delegation. The legacy `xfail` test is
replaced by deterministic assertions on the new path.
"""

from __future__ import annotations

from unittest.mock import patch

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest

from podcasts.models import Episode
from podcasts.services.updater import EpisodeUpdater
from podcasts.tests.factories import PodcastFactory


@pytest.mark.django_db
def test_updater_delegates_to_refresh_service():
    """`EpisodeUpdater.populate` MUST delegate to `RefreshService` and stay
    within the per-feed statement budget.
    """
    podcast = PodcastFactory(name="Test Pod", feed="http://test.com/feed")
    mock_items = [
        {
            "title": f"Ep {i}",
            "link": f"http://test.com/{i}",
            "published": "Fri, 01 Jan 2023 10:00:00 GMT",
            "description": "desc",
            "enclosure": f"http://audio.com/{i}.mp3",
            "tags": [f"tag-{i % 5}"],
        }
        for i in range(10)
    ]
    with patch("podcasts.services.refresh_service.parse_feed") as mock_parse:
        mock_parse.return_value = {
            "title": "Test Pod",
            "language": "en",
            "image": "http://img.com",
            "items": mock_items,
        }
        with CaptureQueriesContext(connection) as ctx:
            results = EpisodeUpdater(["http://test.com/feed"]).populate()

    # Exactly one result, with all 10 episodes added.
    assert len(results) == 1
    assert results[0]["episodes_added"] == 10
    assert results[0]["error"] is None

    # Per-feed budget (generous): 1 podcast lookup + 1 language upsert +
    # 1 link preload + 1 tag SELECT + 1 tag bulk_create + 1 episode
    # bulk_create + 10 tag.add + 1 image/language save = 17. We allow 35
    # to give headroom for sub-statements inside Django.
    assert len(ctx.captured_queries) <= 35

    # Episodes were persisted with the right podcast.
    assert Episode.objects.filter(podcast=podcast).count() == 10
