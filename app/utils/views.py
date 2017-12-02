from flask import Blueprint
from app.utils.tasks import update_base, update_total_episodes


utils = Blueprint('utils', __name__)


@utils.route('/episodes/update')
def update_episodes():
    task = update_base.delay()
    return task.id, 200

@utils.route('/episodes/count')
def count_episodes():
    task = update_total_episodes.delay()
    return task.id, 200
