from flask import Flask
from flask.ext.elasticsearch import FlaskElasticsearch
from flask.ext.sqlalchemy import SQLAlchemy
from flask_restful import Api

app = Flask(__name__)
app.config.from_pyfile('../config/dev.cfg')

es = FlaskElasticsearch(app)
db = SQLAlchemy(app)
apx = Api(app)


from app.site.views import site
from app.api.resources import PodcastAPI

apx.add_resource(PodcastAPI, '/api/podcasts/<int:id>', endpoint="podcasts")
apx.add_resource(PodcastAPI, '/api/podcasts/', endpoint="podcast")
app.register_blueprint(site)
