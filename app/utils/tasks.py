from app import app, celery
from backend.podcasts.services.updater import EpisodeUpdater
from backend.podcasts.models import Podcast
import requests


@celery.task()
def add_episode(feed):
    with app.app_context():
        episodes = EpisodeUpdater(feed)
        episodes.populate()


@celery.task(name='update_base')
def update_base():
    """
    Performs a full update of episodes for all podcasts and refreshes each podcast's episode count.
    
    Fetches all podcast feed URLs, populates episodes for those feeds, updates and saves each podcast's total_episodes, and sends a heartbeat HTTP request when finished.
    """
    with app.app_context():
        feeds = list(Podcast.objects.values_list('feed', flat=True))
        episodes = EpisodeUpdater(feeds)
        episodes.populate()
        update_total_episodes()
        requests.get("https://hchk.io/a6f9d3b8-fa0d-4af5-8563-a793a67a9db1")


@celery.task(name='update_total_episodes')
def update_total_episodes():
    """
    Update each Podcast's total_episodes to the current number of related episodes and persist the change.
    
    This function iterates all Podcast objects, sets each podcast's total_episodes to the count of its related episodes, saves the updated podcast, and issues an HTTP GET to a monitoring heartbeat URL.
    """
    with app.app_context():
        podcasts = Podcast.objects.all()
        for podcast in podcasts:
            podcast.total_episodes = podcast.episodes.count()
            podcast.save()
        requests.get("https://hchk.io/5db2d9f6-c920-4b87-a671-cc4681bffc02")


@celery.task(name='remove_podcasts')
def remove_podcasts():
    """
    Delete podcasts that have no episodes and notify the monitoring heartbeat.
    
    Iterates over all Podcast records, deletes any podcast whose related episode count is zero, and then performs an HTTP GET to the monitoring heartbeat URL.
    """
    with app.app_context():
        podcasts = Podcast.objects.all()
        for podcast in podcasts:
            if podcast.episodes.count() == 0:
                podcast.delete()
        requests.get("https://hchk.io/70e00b3a-fe32-491b-8c0f-eb93b6a3fdc5")