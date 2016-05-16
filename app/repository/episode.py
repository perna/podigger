from sqlalchemy import asc
from app.api.models import Episode, db

class EpisodeRepository:

    def search_by_term(self, term):

        query = Episode.query.search(term).with_entities(Episode.to_json).order_by(asc(Episode.published))
        episodes = []
        for q in query:
            row = q
            episodes.append(row)

        return episodes
