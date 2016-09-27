import time
from sqlalchemy import exists
from . parser import get_episodes
from ..api.models import Tag, Episode, Podcast, PodcastLanguage, db


class EpisodeUpdater(object):

    def __init__(self, feeds):
        self.feeds = feeds
        self.episodes = {}

    def populate(self):
            for link in self.feeds:
                try:
                    pod = Podcast.query.filter_by(feed=link).first()
                    podcast = get_episodes(link[0])
                    pod.image = podcast['image']
                    language = PodcastLanguage.query.filter_by(code=podcast['language']).first()

                    print('language ' + str(language))

                    if language is not None:
                        pod.language_id = language.id
                        db.session.add(pod)
                    else:
                        new_language = PodcastLanguage(code=podcast['language'])
                        db.session.add(new_language)
                    db.session.commit()

                    for item in podcast['items']:
                        episode = {}
                        tag_list = []

                        episode['podcast'] = podcast['title']
                        episode['title'] = item['title']
                        episode['link'] = item['link']
                        episode['description'] = item['description']
                        episode['published'] = item['published']

                        try:
                            test_time = item['published']
                            time.strptime(test_time[:25], '%a, %d %b %Y %H:%M:%S')
                        except ValueError:
                            continue

                        if 'tags' in item:
                            episode['tags'] = item['tags']

                            for tag in episode['tags']:
                                tag_exists = db.session.query(exists().where(Tag.name == tag)).first()

                                if not tag_exists[0]:
                                    t = Tag(name=tag)
                                    db.session.add(t)
                                    db.session.flush()
                                    tag_list.append(t)

                        if 'enclosure' in item:
                            episode['enclosure'] = item['enclosure']

                        episode_exists = db.session.query(Episode).filter_by(link=episode['link']).first()

                        if episode_exists is None:
                            ep = Episode(
                                title=episode['title'],
                                link=episode['link'],
                                description=episode['description'],
                                published=episode['published'],
                                enclosure=episode['enclosure'],
                                podcast_id=pod.id,
                                data_json=episode
                            )

                            if tag_list:
                                for ep_tag in tag_list:
                                    ep.tags.append(ep_tag)

                            db.session.add(ep)
                    db.session.commit()
                except:
                    pass
