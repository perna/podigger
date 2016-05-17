from app import celery, app
from app.parser.update_base import EpisodeUpdater
from app.api.models import Podcast


@celery.task()
def update_async_episodes(feeds):
    episodes = EpisodeUpdater(feeds)
    episodes.populate()


@celery.task(name='update_base')
def update_base():
    feeds = Podcast.query.with_entities(Podcast.feed).all()
    episodes = EpisodeUpdater(feeds)
    episodes.populate()
