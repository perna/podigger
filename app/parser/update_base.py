from elasticsearch import Elasticsearch
from sqlalchemy import exists
import json
from . parser import get_episodes
from app.api.models import Tag, Episode, Podcast, db


class EpisodeUpdater(object):

    def __init__(self, feeds):
        self.es = Elasticsearch()
        self.feeds = feeds
        self.episodes = {}

    def populate(self):

        for link in self.feeds:

            pod = Podcast.query.filter_by(feed=link).first()
            podcast = json.loads(get_episodes(link[0]))
            tag_list = None

            for item in podcast['items']:
                episode = {}

                episode['podcast'] = podcast['title']
                episode['title'] = item['title']
                episode['link'] = item['link']
                episode['description'] = item['description']
                episode['published'] = item['published']

                if 'tags' in item:
                    episode['tags'] = item['tags']

                    for tag in episode['tags']:
                        tag_exists = db.session.query(exists().where(Tag.name == tag)).scalar()

                        if not tag_exists:
                            tag_list = Tag(name=tag)
                            db.session.add(tag_list)

                if 'enclosure' in item:
                    episode['enclosure'] = item['enclosure']
                else:
                    episode['enclosure'] = None

                episode_exists = db.session.query(Episode).filter_by(link=episode['link']).first()

                if not episode_exists:
                    ep = Episode(
                        title=episode['title'],
                        link=episode['link'],
                        description=episode['description'],
                        published=episode['published'],
                        enclosure=episode['enclosure'],
                        podcast_id=pod.id
                    )

                    if tag_list is not None:
                        ep.tags.append(tag_list)

                    db.session.add(ep)
                    db.session.commit()

                res = self.es.index(index='podcasts', doc_type='episode', body=json.dumps(episode))
                return {"created": res['created']}
