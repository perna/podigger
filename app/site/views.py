from flask import Blueprint, render_template
from app.parser.update_base import EpisodeUpdater
from app.api.models import Podcast

site = Blueprint('site', __name__)


@site.route("/")
def index():
    return render_template("site/index.html")


@site.route("/tests")
def test():

    feeds = Podcast.query.with_entities(Podcast.feed).all()

    up = EpisodeUpdater(feeds)
    up.populate()
    return 'instancia ok'

