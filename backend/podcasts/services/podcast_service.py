import logging
from typing import TypedDict

from django.db import transaction

from podcasts.models import Podcast
from podcasts.tasks import add_episode, reimport_feed

from .feed_parser import is_valid_url_format

logger = logging.getLogger(__name__)


class PodcastCreateResult(TypedDict):
    """Result dictionary for podcast creation."""

    id: int | None
    status: str
    message: str | None


class PodcastService:
    """Service for managing Podcast operations."""

    @staticmethod
    def create_podcast(name: str, feed: str) -> PodcastCreateResult:
        """Create a new podcast or return existing one.

        Args:
            name: The name of the podcast
            feed: The RSS feed URL

        Returns:
            PodcastCreateResult dict with id, status, and message
        """
        if not name or not feed:
            return {
                "id": None,
                "status": "error",
                "message": "o nome e o feed são obrigatórios",
            }

        if not is_valid_url_format(feed):
            return {
                "id": None,
                "status": "error",
                "message": "o formato da URL do feed é inválido",
            }

        # Atomic lookup/create to avoid race conditions
        with transaction.atomic():
            podcast, created = Podcast.objects.get_or_create(
                feed=feed, defaults={"name": name}
            )

        if not created:
            return {
                "id": podcast.id,
                "status": "existing",
                "message": "este podcast já foi adicionado",
            }

        # Trigger async task for new podcasts
        add_episode.delay(feed)

        return {
            "id": podcast.id,
            "status": "created",
            "message": None,
        }

    @staticmethod
    def update_podcast_feed(podcast: Podcast, new_feed_url: str) -> None:
        """Update podcast feed URL and trigger episode re-import.

        Deletes all existing episodes for the podcast and enqueues an async
        task to import episodes from the new feed.

        Parameters:
            podcast: The podcast instance to update.
            new_feed_url: The new RSS feed URL.
        """
        with transaction.atomic():
            podcast.episodes.all().delete()
            podcast.feed = new_feed_url
            podcast.save(update_fields=["feed"])

        reimport_feed.delay(podcast.id)
        logger.info(
            "Updated feed for podcast %s and enqueued re-import",
            podcast.id,
        )
