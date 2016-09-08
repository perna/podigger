from sqlalchemy import func
from app.api.models import Podcast, Episode, db
from app.utils.tasks import add_episode
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
                else:
                    q.name = name
                    q.feed = feed
                    db.session.commit()
                    return {'id': q.id, 'status': 'updated'}
            else:
                podcast = Podcast(name, feed)
                db.session.add(podcast)
                db.session.commit()
                feed = (podcast.feed,)
                add_episode.delay(feed)
                data = json.dumps({'id': podcast.id})
                return data
        else:
            exc = valid_feed.bozo_exception
            data = json.dumps({'status': 'error', 'message': exc.getMessage(), 'line': exc.getLineNumber()})
            return data

    def get_all(self):
        query = Podcast.query.all()
        return query

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


    def count_all(self):
        count = db.session.query(func.count(Podcast.id)).scalar()
        return count

    def search(self, term):
        result = Podcast.query.with_entities(
                Podcast.name, Podcast.feed, func.count(Episode.id).label('total_episodes')
                ).join(Episode).filter(Podcast.name.ilike('%'+str(term)+'%')).\
                group_by(Podcast.name, Podcast.feed).order_by(Podcast.name)
        return result


