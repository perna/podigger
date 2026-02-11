import logging
from typing import TypedDict

from django.db import transaction

from ..models import Podcast
from ..tasks import add_episode
from .feed_parser import is_valid_feed

logger = logging.getLogger(__name__)


class PodcastCreateResult(TypedDict):
    id: int | None
    status: str
    message: str | None


class PodcastService:
    @staticmethod
    def create_podcast(name: str, feed: str) -> PodcastCreateResult:
        """
        Create a new podcast or return existing one.
        
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

        if not is_valid_feed(feed):
            return {
                "id": None,
                "status": "error",
                "message": "o feed informado é inválido",
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
