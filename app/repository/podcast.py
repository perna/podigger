from app.api.models import Podcast, db
import json


class PodcastRepository:

    def create_or_update(self, name, feed):

        q = Podcast.query.filter_by(name=name, feed=feed).first()

        if q is not None:
            if q.name == name and q.feed == feed:
                data = json.dumps({'id': q.id, 'message': 'este podcast já foi adicionado'})
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
            data = json.dumps({'id': podcast.id})
            return data


    def get_all(self):

        query = Podcast.query.with_entities(Podcast.name, Podcast.feed)
        podcasts = []

        for q in query:
            row = {"name": q.name, "feed": q.feed}
            podcasts.append(row)

        return podcasts


    def get_by_id(self, id):
        query = Podcast.query.get(id)
        if query is not None:
            podcast = {"name": query.name, "feed": query.feed}
            return json.dumps(podcast)
        else:
            message = {"message": 'podcast não encontrado'}
            return json.dumps(message)


    def edit(self, id, name=None, feed=None):
        query = Podcast.query.get(id)
        if query is not None:
            podcast = {"name": query.name, "feed": query.feed}
            return podcast
        else:
            message = {"message": 'podcast não encontrado'}
            return message


    def delete(self, id):
        query = Podcast.query.get(id)
        if query is not None:
            db.session.delete(query)
            db.session.commit()
            message = {"id": query.id}
        else:
            message = {"message": 'podcast não encontrado'}

        return message


    def count_all():
        count = db.session.query(Podcast).count()
        return count