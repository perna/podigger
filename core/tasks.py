from celery import shared_task
from .updater import EpisodeUpdater

@shared_task
def updateEpisodes(podcast):
    updater = EpisodeUpdater(podcast.feed)
    updater.populate()
