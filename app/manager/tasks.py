import requests
from app import celery, app, es
from app.parser.update_base import EpisodeUpdater


@celery.task()
def update_async_episodes(feeds):
    #with app.app_context():
    episodes = EpisodeUpdater(feeds)
    episodes.populate()


@celery.task(name='hello_world')
def hello_workd():
    print('hello world')


@celery.task(name='ping_site')
def ping_site():
    r = requests.get('http://andersonmeira.com')
    print(r.status_code)
    print(type(r.status_code))