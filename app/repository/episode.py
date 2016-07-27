from sqlalchemy import desc
from app.api.models import Episode, Podcast, db
from app import cache

class EpisodeRepository:

    def search_by_term(self, term):
        query = Episode.query.search(term).with_entities(Episode.to_json).order_by(desc(Episode.published))
        episodes = []
        for row in query:
            episodes.append(row)

        return episodes

    @cache.memoize(timeout=300)
    def count_all(self):
        count = db.session.query(Episode).count()
        return count


    def get_all_by_podcast(self, id):
        query = Episode.query.join(Podcast).filter(Podcast.id == id).all()
        episodes = []

        for episode in query:
            ep = {
                "title": episode.title,
                "description": episode.description,
                "published": str(episode.published),
                "enclosure": episode.enclosure,
                "link": episode.link
            }
            episodes.append(ep)

        return episodes

    def result_search_paginate(self, term, page_num, num_per_page):
        result_query = Episode.query.search(term).order_by(desc(Episode.published)).paginate(page=page_num, per_page=num_per_page)
        return result_query
