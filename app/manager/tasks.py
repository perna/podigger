from elasticsearch import Elasticsearch
from app import celery, app
from app.parser.update_base import EpisodeUpdater
from app.api.models import Podcast


@celery.task()
def update_async_episodes(feeds):
    episodes = EpisodeUpdater(feeds)
    episodes.populate()


@celery.task(name='update_base')
def update_base():
    #es = Elasticsearch()
    #es.indices.delete(index='podcasts', ignore=[400, 404])
    #es.indices.create(index='podcasts', ignore=400, body=app.config.get('ES_INDEX_SETTINGS'), timeout=30)
    feeds = Podcast.query.with_entities(Podcast.feed).all()
    episodes = EpisodeUpdater(feeds)
    episodes.populate()
