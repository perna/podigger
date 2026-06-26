"""Refresh service for the podcasts app.

Extracted from the original `EpisodeUpdater` (US2, Q5) so the per-feed work
is unit-testable in isolation (FR-011) and so the statement budget is
deterministic (FR-003, SC-002).

Public surface:
    * `RefreshService.process_feed(feed_url) -> RefreshResult`
    * `RefreshService.process_all() -> list[RefreshResult]`

Private helpers:
    * `_preload_existing_links(podcast, candidate_links) -> set[str]`
    * `_resolve_tags(names) -> tuple[dict[str, Tag], int]`
    * `_bulk_insert_episodes(podcast, items, parsed) -> list[Episode]`
    * `_reset_total_episode_counters() -> int`

Statement budget (per feed, N new episodes, T unique tags):
    ≤ N + ceil(N/500) + 6 statements.
For a typical N=50, T=20: ≤ 57 statements (down from ≈ 305 today).

Counter reset is a single `UPDATE ... FROM (SELECT ... GROUP BY ...)`
statement at the end of `process_all` (SC-004), replacing the per-podcast
`COUNT(*) + save()` fan-out.
"""

from __future__ import annotations

import logging
import time
from typing import TypedDict

from django.db import connection, transaction
from django.utils import timezone as dj_timezone
from django.utils.dateparse import parse_datetime

from podcasts.models import Episode, Podcast, PodcastLanguage, Tag

from .feed_parser import parse_feed

logger = logging.getLogger(__name__)


class RefreshResult(TypedDict):
    """Typed result of `RefreshService.process_feed`."""

    feed_url: str
    podcast_id: int | None
    episodes_added: int
    tags_added: int
    statements: int
    duration_ms: int
    error: str | None


def _ms_since(start: float) -> int:
    """Return the elapsed wall time in milliseconds since `start`."""
    return int((time.perf_counter() - start) * 1000)


class RefreshService:
    """Per-feed refresh orchestrator with a bounded SQL statement budget."""

    #: `bulk_create` batch size. 500 is well below the Postgres 65 535
    #: bind-parameter limit and keeps individual statements small.
    BULK_BATCH_SIZE = 500

    def process_feed(self, feed_url: str) -> RefreshResult:
        """Process a single feed and return a `RefreshResult`.

        The whole per-feed block is wrapped in `transaction.atomic()` so a
        failure rolls back that feed only; the next feed continues.
        """
        start = time.perf_counter()
        statement_count = 0
        episodes_added = 0
        tags_added = 0
        podcast_id: int | None = None
        try:
            with transaction.atomic():
                podcast = (
                    Podcast.objects.filter(feed=feed_url)
                    .select_related("language")
                    .first()
                )
                statement_count += 1
                if not podcast:
                    logger.warning("Podcast com feed %s não encontrado.", feed_url)
                    return RefreshResult(
                        feed_url=feed_url,
                        podcast_id=None,
                        episodes_added=0,
                        tags_added=0,
                        statements=statement_count,
                        duration_ms=_ms_since(start),
                        error=None,
                    )
                podcast_id = podcast.id

                parsed = parse_feed(feed_url)

                # 1. Upsert the PodcastLanguage once per feed.
                lang_code = parsed.get("language")
                language = None
                if lang_code:
                    language, _ = PodcastLanguage.objects.get_or_create(code=lang_code)
                    statement_count += 1

                items = parsed.get("items", [])

                # 2. Pre-load existing episode links for this feed.
                candidate_links = [
                    item.get("link") for item in items if item.get("link")
                ]
                existing_links = self._preload_existing_links(podcast, candidate_links)
                statement_count += 1

                # 3. Resolve all tags in one round-trip.
                candidate_tag_names: set[str] = set()
                for item in items:
                    for tag_name in item.get("tags", []) or []:
                        candidate_tag_names.add(tag_name)
                tags_by_name, new_tags_count = self._resolve_tags(candidate_tag_names)
                statement_count += 2  # SELECT + bulk_create
                tags_added = new_tags_count

                # 4. Build the new-episode list (skip duplicates).
                new_items = [
                    item
                    for item in items
                    if item.get("link") and item.get("link") not in existing_links
                ]

                if new_items:
                    # 5. Bulk-insert the new episodes in batches.
                    new_episodes = self._bulk_insert_episodes(podcast, new_items)
                    statement_count += max(
                        1, -(-len(new_episodes) // self.BULK_BATCH_SIZE)
                    )
                    episodes_added = len(new_episodes)

                    # 6. Attach tags to the new episodes. One `add()` per
                    # episode; small cost because each new_episode has a
                    # primary key from `bulk_create`.
                    for episode, item in zip(new_episodes, new_items, strict=True):
                        tag_names = item.get("tags", []) or []
                        tags = [
                            tags_by_name[name]
                            for name in tag_names
                            if name in tags_by_name
                        ]
                        if tags:
                            episode.tags.add(*tags)
                    statement_count += sum(
                        len(item.get("tags", []) or []) > 0 for item in new_items
                    )

                # 7. Update the podcast's image and language.
                podcast.image = parsed.get("image") or podcast.image
                if language is not None:
                    podcast.language = language
                podcast.save(update_fields=["image", "language"])
                statement_count += 1

        except Exception as exc:  # pragma: no cover - defensive logging
            logger.exception("Falha ao processar o feed %s", feed_url)
            return RefreshResult(
                feed_url=feed_url,
                podcast_id=None,
                episodes_added=0,
                tags_added=0,
                statements=statement_count,
                duration_ms=_ms_since(start),
                error=type(exc).__name__,
            )

        return RefreshResult(
            feed_url=feed_url,
            podcast_id=podcast_id,
            episodes_added=episodes_added,
            tags_added=tags_added,
            statements=statement_count,
            duration_ms=_ms_since(start),
            error=None,
        )

    def process_all(self) -> list[RefreshResult]:
        """Process every podcast's feed, then reset `total_episodes` once.

        The counter reset is a single `UPDATE ... FROM (SELECT ... GROUP BY ...)`
        statement (SC-004). If at least one feed processed without raising,
        the reset runs in its own `transaction.atomic()` so the counter
        matches the actual rows at commit time.
        """
        feeds = list(Podcast.objects.values_list("feed", flat=True))
        results: list[RefreshResult] = []
        for feed_url in feeds:
            result = self.process_feed(feed_url)
            results.append(result)
        if any(r["error"] is None for r in results):
            self._reset_total_episode_counters()
        return results

    def _preload_existing_links(
        self, podcast: Podcast, candidate_links: list[str]
    ) -> set[str]:
        """Return the set of existing `Episode.link` for `podcast` in one query."""
        if not candidate_links:
            return set()
        return set(
            Episode.objects.filter(
                podcast=podcast, link__in=candidate_links
            ).values_list("link", flat=True)
        )

    def _resolve_tags(self, names: set[str]) -> tuple[dict[str, Tag], int]:
        """Return `{name: Tag}` for every name in `names`, creating missing ones.

        Implementation: one SELECT to find existing tags, one
        `bulk_create` of the missing ones. Idempotent under retry because
        the call is wrapped in the caller's `transaction.atomic()`.
        """
        if not names:
            return {}, 0
        existing: dict[str, Tag] = {
            t.name: t for t in Tag.objects.filter(name__in=names).only("id", "name")
        }
        missing = [Tag(name=n) for n in names if n not in existing]
        if missing:
            Tag.objects.bulk_create(missing, batch_size=self.BULK_BATCH_SIZE)
            # Reload to get the PKs assigned by the database.
            existing = {
                t.name: t for t in Tag.objects.filter(name__in=names).only("id", "name")
            }
        return existing, len(missing)

    def _bulk_insert_episodes(
        self, podcast: Podcast, items: list[dict]
    ) -> list[Episode]:
        """Insert the new episodes via `bulk_create` and return the persisted rows."""
        episodes: list[Episode] = []
        for item in items:
            published_dt = _parse_published(item.get("published", ""))
            if published_dt is None:
                logger.warning(
                    "Formato de data inválido para o episódio: %s",
                    item.get("title"),
                )
                continue
            episodes.append(
                Episode(
                    podcast=podcast,
                    title=item.get("title", ""),
                    link=item.get("link", ""),
                    description=item.get("description", ""),
                    published=published_dt,
                    enclosure=item.get("enclosure", ""),
                    to_json=item,
                )
            )
        return Episode.objects.bulk_create(episodes, batch_size=self.BULK_BATCH_SIZE)

    def _reset_total_episode_counters(self) -> int:
        """Reset every `Podcast.total_episodes` in a single statement.

        This replaces the per-podcast `COUNT(*) + save()` fan-out (SC-004).
        Wrapped in its own `transaction.atomic()` so the reset is all-or-
        nothing: either every counter is consistent, or none is.
        """
        with transaction.atomic(), connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE podcasts_podcast
                SET total_episodes = c.cnt
                FROM (
                    SELECT id, COUNT(*) AS cnt
                    FROM podcasts_episode
                    GROUP BY podcast_id
                ) c
                WHERE podcasts_podcast.id = c.id
                """
            )
            return cursor.rowcount


def _parse_published(value: str):
    """Parse a feed-published timestamp into a timezone-aware datetime.

    Accepts both RFC 822 ("Fri, 01 Jan 2023 10:00:00 GMT") and ISO 8601.
    Returns None for unparseable input.
    """
    if not value:
        return None
    try:
        parsed = parse_datetime(value)
        if parsed is not None:
            return parsed
    except (ValueError, TypeError):
        pass
    try:
        import time as _time

        struct_time = _time.strptime(value[:25], "%a, %d %b %Y %H:%M:%S")
        dt = dj_timezone.datetime.fromtimestamp(
            _time.mktime(struct_time), tz=dj_timezone.utc
        )
        return dj_timezone.localtime(dt)
    except (ValueError, TypeError):
        return None
