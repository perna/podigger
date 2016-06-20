from app import app, celery
from app.parser.updater import EpisodeUpdater
from app.api.models import Podcast
from .email import SendMail


@celery.task()
def add_episode(feed):
    with app.app_context():
        episodes = EpisodeUpdater(feed)
        episodes.populate()


@celery.task(name='update_base')
def update_base():
    with app.app_context():
        email = SendMail()
        feeds = Podcast.query.with_entities(Podcast.feed).all()
        episodes = EpisodeUpdater(feeds)
        episodes.populate()
        email.send('celery task update_base', 'Atualizando a base de episódios {}'.format(feeds))
