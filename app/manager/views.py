from flask import Blueprint
from app.api.models import Podcast
from app.manager.tasks import update_base
from app import es
import json

manager = Blueprint('manager', __name__)


@manager.route('/episodes/update')
def update_episodes():
    task = update_base.delay()
    return task.id, 200


@manager.route('/episodes/delete')
def delete_episodes():
    es.indices.delete(index='podcasts', ignore=[400, 404])
    msg = {'message': 'deleted'}
    return json.dumps(msg), 200


@manager.route('/episodes/create')
def create_index():
    mapping='''
    {
        "settings" : {
        "number_of_shards" : 3,
        "number_of_replicas" : 2
        },
        "mappings":{
            "episodes":{
                "properties": {
                    "podcast": {
                        "type": "string"
                    },
                    "title": {
                        "type": "string",
                        "analyzer": "brazilian"
                    },
                    "description":{
                        "type": "string",
                        "analyzer": "brazilian"
                    },
                    "published": {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    "tags":{
                        "type": "string"
                    },
                    "enclosure": {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    "link": {
                        "type": "string", "index": "not_analyzed"
                    }
                }
            }
        }
    }
    '''
    res = es.indices.create(index='podcasts', ignore=400, body=mapping)
    msg = {'message': 'created', 'status': res}
    return json.dumps(msg), 200

