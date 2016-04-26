from app import celery, app, es
from app.parser.update_base import EpisodeUpdater


@celery.task()
def update_async_episodes(feeds):
    with app.app_context():
        episodes = EpisodeUpdater(feeds)
        episodes.populate()


@celery.task(name='hello_world')
def hello_workd():
    #with app.app_context():
    print('Felipe')