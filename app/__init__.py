from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.cors import CORS
from flask_restful import Api
from celery import Celery
from flask_debugtoolbar import DebugToolbarExtension
from config.config import DevConfiguration

app = Flask(__name__)
app.config.from_object(DevConfiguration)

db = SQLAlchemy(app)
CORS(app)
apx = Api(app)
toolbar = DebugToolbarExtension(app)

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'])
celery.conf.update(app.config)

from app.site.views import site
from app.utils.views import utils
from app.api.resources import PodcastAPI, PodcastListAPI, TermListAPI, EpisodeAPI, PopularTermAPI

apx.add_resource(PodcastAPI, '/api/podcasts/<int:id>', endpoint="podcast")
apx.add_resource(PodcastListAPI, '/api/podcasts/', endpoint="podcasts")
apx.add_resource(TermListAPI, '/api/podcasts/episodes/', endpoint="episodes-list")
apx.add_resource(EpisodeAPI, '/api/podcasts/<int:podcast_id>/episodes/', endpoint="episodes")
apx.add_resource(PopularTermAPI, '/api/terms/<init_date>/',
                 '/api/terms/<init_date>/<final_date>/',
                 '/api/terms/<init_date>/<final_date>/<num_limit>', endpoint="terms")

app.register_blueprint(site)
app.register_blueprint(utils, url_prefix='/utils')
