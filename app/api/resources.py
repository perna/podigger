from datetime import date
from flask.ext.restful import Resource, reqparse
from app.repository.podcast import PodcastRepository
from app.repository.episode import EpisodeRepository
from app.repository.term import TermRepository


class PodcastAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('name', type=str, required=True, location='json', help="o nome é obrigatório")
        self.parser.add_argument('feed', type=str, required=True, location='json', help="o feed é obrigatório")
        self.repository = PodcastRepository()
        super(PodcastAPI, self).__init__()

    def get(self, podcast_id):
        result = self.repository.get_by_id(podcast_id)
        return result, 200

    def put(self, podcast_id):
        args = self.parser.parse_args()
        result = self.repository.edit(podcast_id, args['name'], args['feed'])
        return result, 200

    def delete(self, podcast_id):
        result = self.repository.delete(podcast_id)
        return result


class PodcastListAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('name', type=str, required=True, location='json', help="o nome é obrigatório")
        self.parser.add_argument('feed', type=str, required=True, location='json', help="o feed é obrigatório")
        self.repository = PodcastRepository()
        super(PodcastListAPI, self).__init__()

    def get(self):
        podcast = PodcastRepository()
        query = podcast.get_all()
        podcasts = []
        for q in query:
            row = {"id": q.id, "name": q.name, "feed": q.feed, "total_episodes": q.episodes.count()}
            podcasts.append(row)

        return podcasts, 200

    def post(self):
        args = self.parser.parse_args()
        result = self.repository.create_or_update(args['name'], args['feed'])
        return result, 201


class TermListAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('term', type=str, required=True, location='json')
        super(TermListAPI, self).__init__()

    def post(self):
        args = self.parser.parse_args()
        episode = EpisodeRepository()
        episodes = episode.search_by_term(args['term'])
        term = TermRepository()
        term.create_or_update(args['term'])

        return episodes, 200


class EpisodeAPI(Resource):

    def get(self, podcast_id):
        episode = EpisodeRepository()
        episodes = episode.get_all_by_podcast(podcast_id)

        return episodes, 200


class PopularTermAPI(Resource):

    def get(self, init_date, final_date=date.today(), num_limit=10):
        popterm = TermRepository()
        terms = popterm.get_top_terms(init_date, final_date, num_limit)
        dates = {
            "initial_date" : str(init_date),
            "final_date": str(final_date)
        }
        terms.append(dates)

        return terms, 200
