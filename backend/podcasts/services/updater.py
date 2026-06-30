"""Backward-compatible thin orchestrator around `RefreshService`.

The per-feed logic has been extracted into `RefreshService` (US2, Q5).
`EpisodeUpdater` is kept temporarily as a thin delegator so the migration
in T028 is bisectable; it is deleted in a follow-up commit on the same
branch.
"""

from __future__ import annotations

import logging

from .refresh_service import RefreshResult, RefreshService

logger = logging.getLogger(__name__)


class EpisodeUpdater:
    """Thin orchestrator that delegates to `RefreshService`.

    Kept for one commit only; the new code should call
    `RefreshService` directly.
    """

    def __init__(self, feeds):
        """Initialize the orchestrator with the list of feed URLs to process.

        Parameters:
            feeds: Iterable of podcast feed URLs.
        """
        self.feeds: list[str] = list(feeds)
        self._service = RefreshService()

    def populate(self) -> list[RefreshResult]:
        """Delegate to `RefreshService.process_feed` for the configured feeds."""
        return [self._service.process_feed(url) for url in self.feeds]
