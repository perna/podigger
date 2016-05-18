from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.cors import CORS
from flask_restful import Api
from celery import Celery
from config.config import DevConfiguration

app = Flask(__name__)
app.config.from_object(DevConfiguration)

db = SQLAlchemy(app)
apx = Api(app)
CORS(app)

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'])
celery.conf.update(app.config)

from app.site.views import site
from app.manager.views import manager
from app.api.resources import PodcastAPI, PodcastListAPI, TermListAPI

apx.add_resource(PodcastAPI, '/api/podcasts/<int:id>',endpoint="podcast")
apx.add_resource(PodcastListAPI, '/api/podcasts/',endpoint="podcasts")
apx.add_resource(TermListAPI, '/api/podcasts/episodes/', endpoint="episodes")

app.register_blueprint(site)
app.register_blueprint(manager, url_prefix='/manager')
