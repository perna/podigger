from elasticsearch import Elasticsearch
import json
from . parser import get_episodes
from app.api import models

class EpisodeUpdater(object):

    def __init__(self, feeds):
        self.es = Elasticsearch()
        self.feeds = feeds
        self.episodes = {}

    def populate(self):

        for link in self.feeds:

            podcast = json.loads(get_episodes(link[0]))

            for item in podcast['items']:
                episode = {}
                episode['podcast'] = podcast['title']
                episode['title'] = item['title']
                episode['link'] = item['link']
                episode['description'] = item['description']
                episode['tags'] = item['tags']
                episode['published'] = item['published']

                if 'enclosure' in item:
                    episode['enclosure'] = item['enclosure']

                res = self.es.index(index='podcasts', doc_type='episode', body=json.dumps(episode))
                print(res['created'])
