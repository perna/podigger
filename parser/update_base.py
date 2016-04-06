from elasticsearch import Elasticsearch
from datetime import datetime
import json
from parser import get_episodes

es = Elasticsearch()

feeds = [
            'http://www.portalcafebrasil.com.br/todos/podcasts/feed/',
            'http://radiofobia.com.br/podcast/category/podcast/feed/',
            'http://feeds.feedburner.com/toscochanchada',
            'http://feeds.feedburner.com/CidadeGamer',
            'http://feeds.feedburner.com/anticastdesign',
            'http://cinemacomrapadura.com.br/feed'
        ]

for link in feeds:

    data = get_episodes(link)

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