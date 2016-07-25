from app import app, celery
from app.parser.updater import EpisodeUpdater
from app.api.models import Podcast
import requests

@celery.task()
def add_episode(feed):
    with app.app_context():
        episodes = EpisodeUpdater(feed)
        episodes.populate()


@celery.task(name='update_base')
def update_base():
    with app.app_context():
        feeds = Podcast.query.with_entities(Podcast.feed).all()
        episodes = EpisodeUpdater(feeds)
        episodes.populate()
        requests.get("https://hchk.io/a6f9d3b8-fa0d-4af5-8563-a793a67a9db1")
