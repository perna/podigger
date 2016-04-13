from elasticsearch import Elasticsearch
import json
from parser import get_episodes
from .site import models

es = Elasticsearch()


for link in feeds:

    podcast = json.loads(data)

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

        res = es.index(index='podcasts', doc_type='episode', body=json.dumps(episode))
        print(res['created'])