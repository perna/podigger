"""Celery tasks for the podcasts app.

This module is the single place where the project's Celery tasks are
declared. Every task inherits from `DbAwareTask` so stale database
connections are closed between tasks — the canonical Django/Celery pattern
for long-lived worker processes. See FR-006 and the `RefreshService` docs.
"""

from __future__ import annotations

import logging

from django.db import close_old_connections, models
from django.db.models import Count

from celery import Task, shared_task

from .models import Podcast, PopularTerm
from .services.refresh_service import RefreshService

logger = logging.getLogger(__name__)


class DbAwareTask(Task):
    """Base Celery task that closes stale database connections.

    Why: each Celery task is a fresh "request" to the database from Django's
    perspective, but the same connection object can outlive a single task in
    a long-lived worker process. Without `close_old_connections()` the worker
    can hold a stale connection open after Postgres restarts, fail with
    `OperationalError: server closed the connection unexpectedly`, and crash.
    The fix is the canonical Django/Celery pattern: call
    `close_old_connections` at task start and on failure. See FR-006.
    """

    abstract = True

    def before_start(self, task_id, args, kwargs):  # noqa: ARG002
        """Close stale connections before each task starts."""
        close_old_connections()

    def on_failure(self, exc, task_id, args, kwargs, einfo):  # noqa: ARG002
        """Close stale connections when a task fails so the next task starts clean."""
        close_old_connections()
        logger.exception("Task %s failed: %s", task_id, exc)


@shared_task(base=DbAwareTask, name="podcasts.record_search_term")
def record_search_term(term: str) -> None:
    """Increment the hit counter for a searched term.

    Enqueued from the episode search endpoint (US1) so the request path
    stays a pure read. Idempotent: uses `get_or_create` plus `F("times") + 1`
    so a duplicate delivery only over-counts by one. Safe to retry.

    Parameters:
        term: The searched term. Empty strings are no-ops.
    """
    if not term:
        return
    term_obj, created = PopularTerm.objects.get_or_create(
        term=term, defaults={"times": 1}
    )
    if not created:
        PopularTerm.objects.filter(pk=term_obj.pk).update(times=models.F("times") + 1)


@shared_task(base=DbAwareTask)
def add_episode(feed_url: str) -> dict:
    """Populate episodes for the podcast feed at the given URL.

    Thin wrapper around `RefreshService.process_feed` so the celery task is
    only a name + queue contract; the real work is unit-testable in
    isolation (see `tests/test_refresh_service.py`).

    Parameters:
        feed_url: URL of the podcast RSS/Atom feed to fetch and process.

    Returns:
        A serialized `RefreshResult` dict so callers / tests can inspect
        the outcome.
    """
    logger.info("Starting add_episode task for feed: %s", feed_url)
    result = RefreshService().process_feed(feed_url)
    logger.info(
        "Finished add_episode task for feed: %s episodes_added=%s error=%s",
        feed_url,
        result["episodes_added"],
        result["error"],
    )
    return dict(result)


@shared_task(base=DbAwareTask, name="update_base")
def update_base() -> list[dict]:
    """Refresh all podcasts and reset every per-podcast `total_episodes`.

    Delegates to `RefreshService.process_all`, which resets the counter in a
    single `UPDATE ... FROM (SELECT ... GROUP BY ...)` statement at the end
    of the run (SC-004). The previous `update_total_episodes` task is
    removed because its per-podcast `COUNT(*)` fan-out is replaced by the
    single statement here.

    Returns:
        A list of `RefreshResult` dicts, one per feed processed.
    """
    logger.info("Starting update_base task")
    results = RefreshService().process_all()
    logger.info("Finished update_base task: %d feeds processed", len(results))
    return [dict(r) for r in results]


@shared_task(base=DbAwareTask, name="remove_podcasts")
def remove_podcasts() -> int:
    """Delete Podcast records that have no associated episodes.

    Unchanged from the previous implementation; kept here for parity and
    because the existing annotated `Count` query is already a single
    statement (no further optimization needed here).

    Returns:
        The number of Podcast rows deleted.
    """
    logger.info("Starting remove_podcasts task")
    deleted_count, _ = (
        Podcast.objects.annotate(num_episodes=Count("episodes"))
        .filter(num_episodes=0)
        .delete()
    )
    logger.info("Deleted %d podcasts with no episodes", deleted_count)
    logger.info("Finished remove_podcasts task")
    return deleted_count
