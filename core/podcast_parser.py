import feedparser
import re

class PodcastParser:

    def __init__(self, url):
        self.podcast = {}
        self.parsed_feed = self.parse_feed(url) 


    def get_podcast_data(self):
        self.get_podcast_info()
        self.get_episodes()

        return self.podcast


    def get_podcast_info(self):
        feed = self.parsed_feed.feed

        if 'title' in feed:
            self.podcast['title'] = feed.title
        
        if 'language' in feed:
            self.podcast['language'] = feed.language.lower()
        
        if 'media_thumbnail' in feed:
            self.podcast['image'] = feed.media_thumbnail[0]['url']

        
    def get_episodes(self):
        self.podcast['items'] = []

        entries = self.parsed_feed.entries

        for entry in entries:
            item = {}

            item['title'] = entry.title
            item['link'] = entry.link
            item['published'] = entry.published

            description = self.remove_html_tags(entry.description)
            
            item['description'] = description

            if hasattr(entry, 'enclosures'):
                item['enclosure'] = entry.enclosures[0].href

            if 'tags' in entry:
                item['tags'] = self.get_tags(entry.tags)

            self.podcast['items'].append(item)

    
    def remove_html_tags(self, content):
        pattern = re.compile((r'(<!--.*?-->|<[^>]*>)'))

        return pattern.sub('', content)


    def get_tags(self, tags):
        tag_list = []
        
        for tag in tags:
            tag_list.append(tag.term)
        
        return tag_list


    def parse_feed(self, url):
        feed = feedparser.parse(url)

        if self.is_valid_feed(feed):
            return feed

    def is_valid_feed(self, feed):
        if feed.bozo == 0:
            return True
        else:
            raise feed.bozo_exception
