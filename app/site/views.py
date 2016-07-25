import json
from flask import Blueprint, render_template, request, flash, redirect
from app.repository.episode import EpisodeRepository
from app.repository.podcast import PodcastRepository
from app.repository.term import TermRepository
from .forms import PodcastForm, PodcastSearchForm
from app.api.models import Podcast


site = Blueprint('site', __name__)


@site.context_processor
def counter():
    podcast_count = PodcastRepository.count_all()
    episode_count = EpisodeRepository.count_all()
    counter = {'podcasts': podcast_count, 'episodes': episode_count}
    return dict(counter=counter)


@site.route("/")
def index():
    return render_template("site/home.html")


@site.route('/search')
@site.route('/search/<int:page>')
def search(page=1):

    term = request.args.get('term')

    if term:
        episode = EpisodeRepository()
        query = episode.result_search_paginate(term, page, 10)
        if query.total > 0:
            flash('{} resultados para {}'.format(query.total, term))
        else:
            flash( 'Nenhum resultado encontrado.')
        return render_template('site/search.html', episodes=query, page="search")
    else:
        return render_template('site/search.html', page="search")


@site.route('/add_podcast', methods=['GET', 'POST'])
def add_podcast():
    form = PodcastForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            podcast = PodcastRepository()
            podcast.create_or_update(form.name.data, form.feed.data)
            flash('Podcast cadastrado com sucesso.', 'success')
            return render_template("site/add_podcast.html", form=form)
        else:
            flash('Erro ao cadastrar o podcast. Verifique os dados e tente novamente', 'danger')
            return render_template("site/add_podcast.html", form=form)
    else:
        return render_template("site/add_podcast.html", form=form)


@site.route('/podcasts', methods=['GET','POST'])
@site.route('/podcasts/<int:page>')
def list_podcasts(page=1):
    form = PodcastSearchForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            podcast = PodcastRepository()
            print(form.term.data)
            podcasts = podcast.search(form.term.data)
            result = podcasts.paginate(page=1, per_page=10)
            return render_template( "site/list_podcasts.html", podcasts=result, form=form)
        else:
            podcasts = None
            flash('Termo não encontrado')
            return render_template( "site/list_podcasts.html", podcasts=podcasts, form=form)
    else:
        podcasts = Podcast.query.paginate(page, per_page=10)
        return render_template("site/list_podcasts.html", podcasts=podcasts, form=form)


@site.route('/about')
def about():
    return render_template("site/about.html", page="about")


@site.route('/contact')
def contact():
    return render_template("site/contact.html", page="contact")
