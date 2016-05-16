from flask.ext.restful import Resource, reqparse
from app.repository.podcast import PodcastRepository
from app.repository.episode import EpisodeRepository
import json


class PodcastAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('name', type=str, required=True, location='json', help="o nome é obrigatório")
        self.parser.add_argument('feed', type=str, required=True, location='json', help="o feed é obrigatório")
        self.repository = PodcastRepository()
        super(PodcastAPI, self).__init__()

    def get(self, id):
        return self.repository.get_by_id(id), 200

    def put(self, id):
        args = self.parser.parse_args()
        result = self.repository.edit(args['id'])
        return result

    def delete(self, id):
        pass


    def post(self):
        args = self.parser.parse_args()
        result = self.repository.create_or_update(args['name'], args['feed'])

        return result, 201


class PodcastListAPI(Resource):

    def get(self):
        podcasts = PodcastRepository()
        return podcasts.get_all(), 200


class TermListAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('term', type=str, required=True, location='json')
        super(TermListAPI, self).__init__()

    def post(self):
        args = self.parser.parse_args()
        episode = EpisodeRepository()
        episodes = episode.search_by_term(args['term'])

        return episodes, 200
