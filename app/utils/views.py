from flask import Blueprint
from app.api.models import Podcast
from app.parser.updater import EpisodeUpdater
from app.utils.tasks import update_base


utils = Blueprint('utils', __name__)


@utils.route('/episodes/update')
def update_episodes():
    task = update_base.delay()
    return task.id, 200

@utils.route('/episodes/update/force')
def force_update():
    feeds = Podcast.query.with_entities(Podcast.feed).all()
    episodes = EpisodeUpdater(feeds)
    episodes.populate()
    return 'ok', 200



