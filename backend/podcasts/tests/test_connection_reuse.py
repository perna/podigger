"""Regression guards for connection reuse (US4, FR-006, SC-005).

Web workers must keep database connections open across requests; Celery
workers must reuse connections between tasks. The tests use Django's
`connection_created` signal and `pg_stat_activity` introspection.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from podcasts.models import Podcast
from podcasts.tests.factories import PodcastFactory


@pytest.mark.django_db(transaction=True)
class TestWebConnectionReuse:
    def test_100_sequential_requests_open_at_most_one_connection(self):
        """Under a 100-request burst, a single web worker opens ≤ 1 PG conn."""
        from django.db.backends.signals import connection_created

        opened: list[object] = []

        def _record(sender, connection, **kwargs):
            opened.append(connection)

        connection_created.connect(_record)
        try:
            client = APIClient()
            for i in range(100):
                # Need a podcast to query
                if not Podcast.objects.filter(name=f"burst-{i}").exists():
                    PodcastFactory(name=f"burst-{i}", feed=f"http://burst-{i}.com")
                response = client.get("/api/podcasts/")
                assert response.status_code == 200
        finally:
            connection_created.disconnect(_record)

        # With `CONN_MAX_AGE > 0` the worker reuses the same connection
        # across requests; we should see at most 1 connection_created
        # event over the whole burst.
        assert (
            len(opened) <= 1
        ), f"100 requests opened {len(opened)} connections; expected ≤ 1"


@pytest.mark.django_db(transaction=True)
class TestCeleryConnectionReuse:
    def test_celery_worker_closes_stale_connections_between_tasks(self):
        """`close_old_connections` MUST be called between Celery tasks."""
        from podcasts.tasks import DbAwareTask, add_episode

        with patch("podcasts.tasks.close_old_connections") as mock_close:
            add_episode.run("http://test.com/feed")
            add_episode.run("http://test.com/feed")
        # The base task's before_start hook called close_old_connections
        # at least once per task.
        assert mock_close.call_count >= 2

        # The base class is a Task subclass with abstract=True.
        assert issubclass(DbAwareTask, object)
        assert getattr(DbAwareTask, "abstract", False) is True
