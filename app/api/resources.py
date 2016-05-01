from flask import request
from flask.ext.restful import Resource, reqparse
from app.api.models import Podcast, Episode, Tag
from app.repository.podcasts import PodcastRepository
import requests
import json
from app import db, app


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

        podcast = PodcastRepository()
        result = podcast.create_or_update(args['name'], args['feed'])

        return result, 201


class TermListAPI(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('term', type=str, required=True, location='json')
        super(TermListAPI, self).__init__()


    def post(self):

        args = self.parser.parse_args()
        url = app.config['ES_URL']['episodes'] + '/_search'

        print(url)

        query = {
            "query": {
                "query_string": {
                    "query": args['term']
                }
            },
            "highlight": {
                "pre_tags" : ["<strong>"],
                "post_tags": ["</strong>"],
                "fields": {
                    "description": {}
                }
            }
        }

        resp = requests.post(url, data=json.dumps(query))
        data = resp.json()
        return data


