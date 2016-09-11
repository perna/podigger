from flask import Blueprint, render_template, request, flash, Markup
from sqlalchemy import func
from ..repository.episode import EpisodeRepository
from ..repository.podcast import PodcastRepository
from ..repository.topic_suggestion import TopicSuggestionRepository
from ..repository.term import TermRepository
from .forms import PodcastForm, PodcastSearchForm, TopicSuggestionForm
from ..api.models import Podcast, Episode
from app import cache

site = Blueprint('site', __name__, template_folder='../templates/site')

@site.context_processor
def counter():
    podcast = PodcastRepository()
    episode = EpisodeRepository()
    podcast_count = podcast.count_all()
    episode_count = episode.count_all()
    counter = {'podcasts': podcast_count, 'episodes': episode_count}
    return dict(counter=counter)


@cache.cached(timeout=3600)
@site.route("/")
def index():
    return render_template("home.html")

@cache.cached(timeout=3600)
@site.route('/search')
@site.route('/search/<int:page>')
def search(page=1):

    term = request.args.get('term')

    if term:
        new_term = TermRepository()
        new_term.create_or_update(term)

        episode = EpisodeRepository()
        episodes = episode.result_search_paginate(term, page, 10)
        if episodes.total:
            flash('{} resultados para {}'.format(episodes.total, term))
        else:
            message = Markup('<span>Nenhum resultado encontrado.</span> <a class="link-add-suggestion" href="/add_topic_suggestion">Gostaria de sugerir o tema?</a>')
            flash(message)
        return render_template('search.html', episodes=episodes, page="search")
    else:
        return render_template('search.html', page="search")


@site.route('/add_podcast', methods=['GET', 'POST'])
def add_podcast():
    form = PodcastForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            podcast = PodcastRepository()
            podcast.create_or_update(form.name.data, form.feed.data)
            flash('Podcast cadastrado com sucesso.', 'success')
            return render_template("add_podcast.html", form=form)
        else:
            flash('Erro ao cadastrar o podcast. Verifique os dados e tente novamente', 'danger')
            return render_template("site/add_podcast.html", form=form)
    else:
        return render_template("add_podcast.html", form=form, page="add_podcast")


@site.route('/podcasts', methods=['GET', 'POST'])
@site.route('/podcasts/<int:page>')
def list_podcasts(page=1):
    if request.method == 'POST':
        form = PodcastSearchForm(request.form)
        if form.validate_on_submit():
            podcast = PodcastRepository()
            podcasts = podcast.search(form.term.data).paginate(page, per_page=10)
            if podcasts.items:
                return render_template("list_podcasts.html", podcasts=podcasts, form=form)
            else:
                flash('Podcast não encontrado')
                return render_template("list_podcasts.html", podcasts=podcasts, form=form)
    else:
        form = PodcastSearchForm()
        podcasts = Podcast.query.with_entities(Podcast.name, Podcast.feed).order_by(Podcast.name).paginate(page, per_page=10)
        return render_template("list_podcasts.html", podcasts=podcasts, form=form)


@site.route('/topic_suggestions')
def list_topic_suggestion():
    topic = TopicSuggestionRepository()
    topics = topic.list_topics()
    return render_template("list_topic_suggestions.html", topics=topics)


@site.route('/add_topic_suggestion', methods=['GET', 'POST'])
def add_topic_suggestion():
    form = TopicSuggestionForm(request.form)
    if form.validate_on_submit():
        topic = TopicSuggestionRepository()
        topic.create(form.title.data, form.description.data)
        flash('Sugestão adicionada com sucesso.')
        return render_template("add_topic_suggestion.html", form=form)
    return render_template("add_topic_suggestion.html", form=form)


@site.route('/trends')
@cache.cached(timeout=1800)
def trends():
    return render_template("trends.html")

@site.route('/about')
@cache.cached(timeout=3600)
def about():
    return render_template("about.html", page="about")


@site.route('/contact')
@cache.cached(timeout=3600)
def contact():
    return render_template("contact.html", page="contact")
