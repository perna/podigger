from flask import Blueprint, render_template
from app.repository.episode import EpisodeRepository
from app.repository.podcast import PodcastRepository
from . import email

site = Blueprint('site', __name__)

@site.route("/")
def index():
    podcast_count = PodcastRepository.count_all()
    episode_count = EpisodeRepository.count_all()
    data = {'podcasts':podcast_count,  'episodes': episode_count}
    return render_template("site/index.html", data=data)


@site.route("/email")
def send_email():
    subject = "assunto teste"
    message = "testando o disparo de email da aplicação"
    response = email.send(subject,message)
    return (response.text, response.status_code)
