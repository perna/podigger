from flask import Blueprint
from app.utils.tasks import update_base


utils = Blueprint('utils', __name__)


@utils.route('/episodes/update')
def update_episodes():
    task = update_base.delay()
    return task.id, 200
