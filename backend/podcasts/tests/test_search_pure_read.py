"""Regression guard: the search endpoint MUST NOT perform any write.

The PopularTerm counter is updated asynchronously by the
`record_search_term` Celery task (US1, Q4). The test asserts that the
search request is a pure read so the contract is locked.
"""

from __future__ import annotations

from unittest.mock import patch

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest
from rest_framework.test import APIClient

from podcasts.models import Episode
from podcasts.tests.factories import PodcastFactory


@pytest.mark.django_db
class TestSearchIsPureRead:
    def setup_method(self):
        self.client = APIClient()
        self.podcast = PodcastFactory()
        for i in range(3):
            Episode.objects.create(
                podcast=self.podcast,
                title=f"Episode about python {i}",
                link=f"https://example.com/{self.podcast.id}-{i}",
                description="Discussing python best practices.",
            )

    def test_search_emits_no_writes(self):
        """`GET /api/episodes/?q=python` MUST NOT issue INSERT/UPDATE/DELETE."""
        with (
            patch("podcasts.views.record_search_term.delay") as mock_delay,
            CaptureQueriesContext(connection) as ctx,
        ):
            response = self.client.get("/api/episodes/?q=python")
        assert response.status_code == 200
        write_kinds = {"INSERT", "UPDATE", "DELETE"}
        writes = [
            q
            for q in ctx.captured_queries
            if q["sql"].split(None, 1)[0].upper() in write_kinds
        ]
        assert writes == [], f"search path emitted writes: {writes}"
        # Counter is enqueued exactly once with the searched term.
        assert mock_delay.call_count == 1
        assert mock_delay.call_args.args == ("python",)

    def test_search_without_query_does_not_enqueue_task(self):
        """When no `q` is supplied, no PopularTerm write is enqueued."""
        with (
            patch("podcasts.views.record_search_term.delay") as mock_delay,
            CaptureQueriesContext(connection) as ctx,
        ):
            response = self.client.get("/api/episodes/")
        assert response.status_code == 200
        assert mock_delay.call_count == 0
        write_kinds = {"INSERT", "UPDATE", "DELETE"}
        writes = [
            q
            for q in ctx.captured_queries
            if q["sql"].split(None, 1)[0].upper() in write_kinds
        ]
        assert writes == []
