from flask import Blueprint, render_template
from app.parser.update_base import EpisodeUpdater
from app.api.models import Podcast
from app import celery, app, es
import json


manager = Blueprint('manager', __name__)


@celery.task()
def update_async_episodes(feeds):
    with app.app_context():
        episodes = EpisodeUpdater(feeds)
        episodes.populate()


@manager.route('/episodes/update')
def update_episodes():
    feeds = Podcast.query.with_entities(Podcast.feed).all()
    task = update_async_episodes.delay(feeds)
    return task.id


@manager.route('/episodes/update/status/<task_id>')
def show_status_update(task_id):
    pass

@manager.route('/episodes/delete')
def delete_episodes():
    es.indices.delete(index='podcasts', ignore=[400, 404])
    msg = {'message': 'deleted'}
    return json.dumps(msg), 200



