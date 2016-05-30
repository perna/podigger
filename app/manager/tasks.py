from app import celery, app
from app.parser.updater import EpisodeUpdater
from app.api.models import Podcast
from .email import SendMail

@celery.task()
def add_episode(feed):
    episodes = EpisodeUpdater(feed)
    episodes.populate()


@celery.task(name='update_base')
def update_base():
    email = SendMail()
    email.send('celery task update_base','Atualizando a base de episódios')
    feeds = Podcast.query.with_entities(Podcast.feed).all()
    episodes = EpisodeUpdater(feeds)
    episodes.populate()
