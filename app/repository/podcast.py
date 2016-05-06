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
            podcast = Podcast(name=name, feed=feed)
            db.session.add(podcast)
            db.session.commit()
            data = json.dumps({'id': podcast.id})
            return data

