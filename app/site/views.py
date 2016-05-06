from flask import Blueprint, render_template
from app.parser.update_base import EpisodeUpdater
from app.api.models import Podcast

site = Blueprint('site', __name__)


@site.route("/")
def index():
    return render_template("site/index.html")