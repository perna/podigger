from sqlalchemy import asc
from app.api.models import Episode, Podcast, db

class EpisodeRepository:

    def search_by_term(self, term):

        query = Episode.query.search(term).with_entities(Episode.to_json).order_by(asc(Episode.published))
        episodes = []
        for q in query:
            row = q
            episodes.append(row)

        return episodes

    def count_all():
        count = db.session.query(Episode).count()
        return count


    def get_all_by_podcast(self, id):
        query = Episode.query.join(Podcast).filter(Podcast.id == id).all()
        episodes = []

        podcast = {
            "name": query[0].podcast.name,
            "feed": query[0].podcast.feed,
        }

        for episode in query:
            ep = {
                "title": episode.title,
                "description": episode.description,
                "published": str(episode.published),
                "enclosure": episode.enclosure,
                "link": episode.link
            }
            episodes.append(ep)

        podcast["episodes"] = episodes

        return podcast






