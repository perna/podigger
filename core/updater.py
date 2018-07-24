from .podcast_parser import PodcastParser
from .models import Podcast, Episode


class EpisodeUpdater:

    def __init__(self, feed):
        self.feed_url = feed
        self.episodes = []
        self.parsed_feed = PodcastParser(self.feed_url)
        self.podcast_data = self.parsed_feed.get_podcast_data()

    def populate(self):
        podcast = self.update_podcast()
        self.setEpisodes(podcast)

    def update_podcast(self):
        podcast, created = Podcast.objects.get_or_create(feed=self.feed_url)

        if created:
            print('criado com sucesso')
        else:
            print('atualizado com sucesso')

        return podcast

    def setEpisodes(self, podcast):
        for item in self.podcast_data['items']:
            print(item)

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
