from flask import Blueprint
from app.api.models import Podcast
from app.manager.tasks import update_base
import json

manager = Blueprint('manager', __name__)


@manager.route('/episodes/update')
def update_episodes():
    task = update_base.delay()
    return task.id, 200


@manager.route('/episodes/delete')
def delete_episodes():
    msg = {'message': 'deleted'}
    return json.dumps(msg), 200

