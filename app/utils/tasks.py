from app import app, celery
from app.parser.updater import EpisodeUpdater
from app.api.models import Podcast, Episode, db
from sqlalchemy import desc
from sqlalchemy.sql.functions import func
import requests
import time

@celery.task()
def add_episode(feed):
    with app.app_context():
        episodes = EpisodeUpdater(feed)
        episodes.populate()


@celery.task(name='update_base')
def update_base():
    with app.app_context():
        last_id =  Podcast.query.with_entities(Podcast.id).order_by(desc(Podcast.id)).first()
        #for ost in range(1, total_podcasts, total_podcasts // 100):
        for feed in range(last_id.id, 1, -1):
            podcast = Podcast.query.get(feed)
            #podcast = Podcast.query.get(19207)
            if podcast is not None:
                print(podcast.feed)
                episodes = EpisodeUpdater(podcast.feed)
                episodes.populate()
            #time.sleep(1)

        requests.get("https://hchk.io/a6f9d3b8-fa0d-4af5-8563-a793a67a9db1")


@celery.task(name='update_total_episodes')
def update_total_episodes():
    with app.app_context():
        #podcasts = Podcast.query.all()
        last_id =  Podcast.query.with_entities(Podcast.id).order_by(desc(Podcast.id)).first()
        print("last_id ", last_id.id)
        for id_podcast in range(last_id.id, 1, -1):
            print("id_podcast ", id_podcast)
            podcast = Podcast.query.get(id_podcast)
            if podcast is not None:
                #podcast.total_episodes = db.session.query(func.count(Episode.id)).filter(Episode.podcast_id == podcast.id).scalar()
                #podcast.total_episodes = db.session.query(func.count('*').select_from(Episode
                qr = db.session.query(Episode).filter(Episode.podcast_id == podcast.id)
                count_q = qr.statement.with_only_columns([func.count()])
                count = qr.session.execute(count_q).scalar()
                podcast.total_episodes = count
                print('numero de episodios ', str(podcast.total_episodes))
                db.session.commit()
                print('total de episodios do podcast ', str(id_podcast), ' atualizado')
            db.session.close()
        requests.get("https://hchk.io/5db2d9f6-c920-4b87-a671-cc4681bffc02")


@celery.task(name='remove_podcasts')
def remove_podcasts():
    with app.app_context():
        podcasts = Podcast.query.all()
        for podcast in podcasts:
            if podcast.episodes.count() == 0:
                db.session.delete(podcast)
        db.session.commit()
        requests.get("https://hchk.io/70e00b3a-fe32-491b-8c0f-eb93b6a3fdc5")
