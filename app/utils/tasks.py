from celery import Celery
from app import app
from app.parser.updater import EpisodeUpdater
from app.api.models import Podcast
from .email import SendMail

def make_celery(app):
    celery = Celery(app.import_name, backend=app.config['CELERY_RESULT_BACKEND'],
                    broker=app.config['CELERY_BROKER_URL'])
    celery.conf.update(app.config)
    TaskBase = celery.Task

    class ContextTask(TaskBase):
        abstract = True
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)

    celery.Task = ContextTask
    return celery


celery = make_celery(app)


@celery.task()
def add_episode(feed):
    episodes = EpisodeUpdater(feed)
    episodes.populate()


@celery.task(name='update_base')
def update_base():
    email = SendMail()
    feeds = Podcast.query.with_entities(Podcast.feed).all()
    episodes = EpisodeUpdater(feeds)
    episodes.populate()
    email.send('celery task update_base', 'Atualizando a base de episódios {}'.format(feeds))
