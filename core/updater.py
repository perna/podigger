from datetime import datetime

from .podcast_parser import PodcastParser
from .models import Podcast, Episode


class EpisodeUpdater:

    def __init__(self, feed):
        self.feed_url = feed
        self.episodes = []
        self.parsed_feed = PodcastParser(self.feed_url)
        self.podcast_data = self.parsed_feed.get_podcast_data()
        self.podcast = self.update_podcast()

    def populate(self):
        podcast = self.update_podcast()
        self.setEpisodes(self.podcast)

    def update_podcast(self):
        try:
            podcast = Podcast.objects.get(feed=self.feed_url)
            return podcast
        except Podcast.DoesNotExist:
            print('Podcasts does not exist')

    def setEpisodes(self, podcast):
        for item in self.podcast_data['items']:
            episode = Episode(
                title= item['title'],
                permalink= item['link'],
                description= item['description'],
                enclosure= item['enclosure'], 
                published_at= item['published'],
                tags= item['tags'],
                podcast= podcast,
            )
            self.episodes.append(episode)

        Episode.objects.bulk_create(self.episodes)

    def get_last_episodes(self):
        pass
