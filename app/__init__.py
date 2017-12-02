from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_cache import Cache
from flask_restful import Api
from celery import Celery
from raven.contrib.flask import Sentry
from flask_debugtoolbar import DebugToolbarExtension
from config.config import DevConfiguration
from app.site.momentjs import Momentjs
import os

from psycopg2cffi import compat
compat.register()

if "PSYCOGREEN" in os.environ:
    from gevent.monkey import patch_all
    patch_all()
    from psycogreen.gevent import patch_psycopg
    patch_psycopg()

    using_gevent = True
else:
    using_gevent = False


app = Flask(__name__)
app.config.from_object(DevConfiguration)

db = SQLAlchemy(app)
if using_gevent:
    db.engine.pool._use_threadlocal = True

db.configure_mappers()

CORS(app)
apx = Api(app)

cache = Cache(app, config={'CACHE_TYPE': 'redis'})
cache.init_app(app)

toolbar = DebugToolbarExtension(app)
sentry = Sentry(app, dsn='https://84940c39403c4b959912ee8b2e32831d:3e38e3dfee0e4cc2b5e8f1ceb6ae0af1@sentry.io/180483')
app.jinja_env.globals['momentjs'] = Momentjs

celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'])
celery.conf.update(app.config)

from app.site.views import site
from app.utils.views import utils
from app.admin.views import admin
from app.api.resources import PodcastAPI, PodcastListAPI, TermListAPI, EpisodeAPI, PopularTermAPI

apx.add_resource(PodcastAPI, '/api/podcasts/<int:podcast_id>', endpoint="podcast")
apx.add_resource(PodcastListAPI, '/api/podcasts/', endpoint="podcasts")
apx.add_resource(TermListAPI, '/api/podcasts/episodes/', endpoint="episodes-list")
apx.add_resource(EpisodeAPI, '/api/podcasts/<int:podcast_id>/episodes/', endpoint="episodes")
apx.add_resource(PopularTermAPI, '/api/terms/<init_date>/',
                 '/api/terms/<init_date>/<final_date>/',
                 '/api/terms/<init_date>/<final_date>/<num_limit>', endpoint="terms")

app.register_blueprint(site)
app.register_blueprint(utils, url_prefix='/utils')
