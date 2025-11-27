import contextlib
import logging

from django.db.models import Count

import requests
from celery import shared_task

from .models import Podcast
from .services.updater import EpisodeUpdater

logger = logging.getLogger(__name__)


@shared_task
def add_episode(feed_url):
    """
    Task to populate episodes for a single feed.
    """
    logger.info("Starting add_episode task for feed: %s", feed_url)
    updater = EpisodeUpdater([feed_url])
    updater.populate()
    logger.info("Finished add_episode task for feed: %s", feed_url)


@shared_task(name="update_base")
def update_base():
    """
    Task to update all podcasts.
    """
    logger.info("Starting update_base task")
    feeds = list(Podcast.objects.values_list("feed", flat=True))
    updater = EpisodeUpdater(feeds)
    updater.populate()

    # Trigger update_total_episodes after population
    update_total_episodes.delay()

    # Legacy healthcheck ping
    # Legacy healthcheck ping
    with contextlib.suppress(requests.RequestException):
        requests.get("https://hchk.io/a6f9d3b8-fa0d-4af5-8563-a793a67a9db1", timeout=10)
    logger.info("Finished update_base task")


@shared_task(name="update_total_episodes")
def update_total_episodes():
    """
    Task to update the total_episodes count for each podcast.
    """
    logger.info("Starting update_total_episodes task")
    podcasts = Podcast.objects.all()
    for podcast in podcasts:
        podcast.total_episodes = podcast.episodes.count()
        podcast.save(update_fields=["total_episodes"])

    # Legacy healthcheck ping
    # Legacy healthcheck ping
    with contextlib.suppress(requests.RequestException):
        requests.get("https://hchk.io/5db2d9f6-c920-4b87-a671-cc4681bffc02", timeout=10)
    logger.info("Finished update_total_episodes task")


@shared_task(name="remove_podcasts")
def remove_podcasts():
    """
    Task to remove podcasts with 0 episodes.
    """
    logger.info("Starting remove_podcasts task")
    # Using filter directly is more efficient than iterating
    Podcast.objects.filter(episodes__isnull=True).delete()
    # Better approach matching legacy logic:
    Podcast.objects.annotate(num_episodes=Count("episodes")).filter(num_episodes=0)
    # Actually, legacy logic iterates and checks count.
    # Let's stick to a safe implementation.

    for podcast in Podcast.objects.all():
        if podcast.episodes.count() == 0:
            podcast.delete()

    # Legacy healthcheck ping
    # Legacy healthcheck ping
    with contextlib.suppress(requests.RequestException):
        requests.get("https://hchk.io/70e00b3a-fe32-491b-8c0f-eb93b6a3fdc5", timeout=10)
    logger.info("Finished remove_podcasts task")
