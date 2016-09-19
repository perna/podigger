from app import app, celery
from app.parser.updater import EpisodeUpdater
from app.api.models import Podcast, db
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
        update_total_episodes()
        requests.get("https://hchk.io/a6f9d3b8-fa0d-4af5-8563-a793a67a9db1")


@celery.task(name='update_total_episodes')
def update_total_episodes():
    with app.app_context():
        podcasts = Podcast.query.all()
        for podcast in podcasts:
            podcast.total_episodes = podcast.episodes.count()
        db.session.commit()
        requests.get("https://hchk.io/5db2d9f6-c920-4b87-a671-cc4681bffc02")


@celery.task(name='remove_podcasts')
def remove_podcasts():
    with app.app_context():
        podcasts = Podcast.query.all()
        for podcast in podcasts:
            if podcast.episodes.count() == 0:
                db.session.delete(podcast)
        db.session.commit()
        requests.get("https://hchk.io/70e00b3a-fe32-491b-8c0f-eb93b6a3fdc5")
