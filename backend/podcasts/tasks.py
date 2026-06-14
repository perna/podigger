import logging

from celery import shared_task
from django.db.models import Count

from .models import Podcast
from .services.updater import EpisodeUpdater

logger = logging.getLogger(__name__)


@shared_task
def add_episode(feed_url):
    """Populate episodes for the podcast feed at the given URL.

    Parameters:
        feed_url (str): URL of the podcast RSS/Atom feed to fetch and process.
    """
    logger.info("Starting add_episode task for feed: %s", feed_url)
    updater = EpisodeUpdater([feed_url])
    updater.populate()
    logger.info("Finished add_episode task for feed: %s", feed_url)


@shared_task
def reimport_feed(podcast_id):
    """Re-import episodes for a podcast after feed URL change.

    Looks up the podcast by ID, retrieves its current feed URL, and uses
    EpisodeUpdater to import episodes from the new feed.

    Parameters:
        podcast_id (int): ID of the podcast whose feed was updated.
    """
    logger.info("Starting reimport_feed task for podcast ID: %s", podcast_id)
    try:
        podcast = Podcast.objects.get(id=podcast_id)
        updater = EpisodeUpdater([podcast.feed])
        updater.populate()
    except Podcast.DoesNotExist:
        logger.exception("Podcast with ID %s not found for re-import", podcast_id)
    else:
        logger.info("Finished reimport_feed task for podcast ID: %s", podcast_id)


@shared_task(name="update_base")
def update_base():
    """Update episodes for all podcasts to populate feeds.

    This enqueues the job that recalculates each podcast's total episode count and
    performs a legacy healthcheck HTTP GET (network errors are suppressed).
    """
    logger.info("Starting update_base task")
    feeds = list(Podcast.objects.values_list("feed", flat=True))
    updater = EpisodeUpdater(feeds)
    updater.populate()

    # Trigger update_total_episodes after population
    update_total_episodes.delay()

    logger.info("Finished update_base task")


@shared_task(name="update_total_episodes")
def update_total_episodes():
    """Task to update the total_episodes count for each podcast."""
    logger.info("Starting update_total_episodes task")
    podcasts = Podcast.objects.all()
    for podcast in podcasts:
        podcast.total_episodes = podcast.episodes.count()
        podcast.save(update_fields=["total_episodes"])

    logger.info("Finished update_total_episodes task")


@shared_task(name="remove_podcasts")
def remove_podcasts():
    """Delete Podcast records that have no associated episodes.

    This task removes podcasts whose related episode count is zero. It also performs
    a legacy healthcheck ping on completion.
    """
    logger.info("Starting remove_podcasts task")

    # Bulk delete podcasts with zero episodes using annotated queryset
    deleted_count, _ = (
        Podcast.objects.annotate(num_episodes=Count("episodes"))
        .filter(num_episodes=0)
        .delete()
    )

    logger.info("Deleted %d podcasts with no episodes", deleted_count)
    logger.info("Finished remove_podcasts task")
