from flask import Blueprint
from app.api.models import Podcast
from app.utils.tasks import update_base
import json

manager = Blueprint('utils', __name__)


@manager.route('/episodes/update')
def update_episodes():
    task = update_base.delay()
    return task.id, 200
