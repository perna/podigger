from sqlalchemy import func, desc
from app.api.models import Podcast, db
from app.utils.tasks import add_episode
#from app.utils.twitter_notifier import TwitterNotifier
from app import cache
import feedparser
import json


class PodcastRepository:

    def create_or_update(self, name, feed):

        valid_feed = feedparser.parse(feed)

        if valid_feed.bozo == 0:

            q = Podcast.query.filter_by(name=name, feed=feed).first()

            if q is not None:
                if q.name == name and q.feed == feed:
                    data = json.dumps({'id': q.id, 'message': 'este podcast já foi adicionado', 'status': 'none'})
                    return data
                elif q.name != name:
                    q.name = name
                    db.session.commit()
                    return {'id': q.id, 'status': 'updated'}
                elif q.feed != feed:
                    q.feed = feed
                    db.session.commit()
                    return {'id': q.id, 'status': 'updated'}
            else:
                podcast = Podcast(name, feed)
                db.session.add(podcast)
                db.session.commit()
                feed = (podcast.feed,)
                add_episode.delay(feed)
                #notifier = TwitterNotifier()
                #notifier.send_tweet(name, feed)
                data = json.dumps({'id': podcast.id})
                return data
        else:
            data = json.dumps({'status': 'error', 'message': 'feed inválido', 'line': ''})
            return data

    @cache.memoize(50)
    def get_all(self):
        query = Podcast.query.all()
        return query

    @cache.memoize(50)
    def get_by_id(self, id_podcast):
        query = Podcast.query.get(id_podcast)
        if query is not None:
            podcast = {"name": query.name, "feed": query.feed}
            return json.dumps(podcast)
        else:
            message = {"message": 'podcast não encontrado'}
            return json.dumps(message)

    def edit(self, id_podcast, name=None, feed=None):
        query = Podcast.query.get(id_podcast)
        if query is not None:
            if query.name == name and query.feed == feed:
                data = json.dumps({'id': query.id, 'message': 'este podcast já foi adicionado', 'status': 'none'})
                return data
            else:
                query.name = name
                query.feed = feed
                db.session.commit()
                return {'id': query.id, 'status': 'updated'}
        else:
            message = {"message": 'podcast não encontrado'}
            return message

    def delete(self, id_podcast):
        query = Podcast.query.get(id_podcast)
        if query is not None:
            db.session.delete(query)
            db.session.commit()
            message = {"id": query.id}
        else:
            message = {"message": 'podcast não encontrado'}

        return message

    @cache.memoize(60)
    def count_all(self):
        count = db.session.query(func.count(Podcast.id)).scalar()
        return count

    def search(self, term):
        result = Podcast.query.with_entities(Podcast.name, Podcast.feed, Podcast.total_episodes).\
        filter(Podcast.name.ilike('%'+str(term)+'%')).order_by(Podcast.name)
        return result


    def get_last_podcasts_thumbs(self):
        podcasts = Podcast.query.with_entities(Podcast.name, Podcast.feed, Podcast.image).order_by(desc(Podcast.id)).limit(6)
        return podcasts
