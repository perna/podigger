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
        result = self.repository.get_by_id(id)
        return result, 200

    def put(self, id):
        args = self.parser.parse_args()
        result = self.repository.edit(id, args['name'], args['feed'])
        return result, 200

    def delete(self, id):
        args = self.parser.parse_args()
        result = self.repository.delete(id)
        return result


class PodcastListAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('name', type=str, required=True, location='json', help="o nome é obrigatório")
        self.parser.add_argument('feed', type=str, required=True, location='json', help="o feed é obrigatório")
        self.repository = PodcastRepository()
        super(PodcastListAPI, self).__init__()

    def get(self):
        podcasts = PodcastRepository()
        return podcasts.get_all(), 200

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

        return episodes, 200


class EpisodeAPI(Resource):

    #def __init__(self):
    #    self.parser = reqparse.RequestParser()
    #    self.parser.add_argument('id', type=int, required=True)
    #    super(EpisodeAPI, self).__init__()

    def get(self, id):
        #args = self.parser.parse_args()
        episode = EpisodeRepository()
        episodes = episode.get_all_by_podcast(id)

        return episodes, 200