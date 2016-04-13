from flask.ext.restful import Resource, reqparse
from app.api.models import Podcast, Episode, Tag
from app import db


class PodcastAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('name', type=str, required=True, location='json')
        self.parser.add_argument('feed', type=str, required=True, location='json')
        super(PodcastAPI, self).__init__()

    def get(self, id):
        return {'teste':'olá'}


    def put(self, id):
        pass


    def delete(self, id):
        pass

    def post(self):
        args = self.parser.parse_args()
        podcast = Podcast(name=args['name'], feed=args['feed'])
        db.session.add(podcast)
        db.session.commit()
        return {'id': podcast.id}, 201


