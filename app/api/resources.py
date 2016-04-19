from flask import request
from flask.ext.restful import Resource, reqparse
from app.api.models import Podcast, Episode, Tag
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
        podcast = Podcast(name=args['name'], feed=args['feed'])
        db.session.add(podcast)
        db.session.commit()
        return {'id': podcast.id}, 201


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
            "highlight" : {
                "pre_tags" : ["<strong>"],
                "post_tags" : ["</strong>"],
                "fields" : {
                    "description" : {}
                }
            }
        }

        resp = requests.post(url, data=json.dumps(query))
        data = resp.json()
        return data


