import feedparser
import maya
import pendulum

import re
from datetime import datetime

class PodcastParser:

    def __init__(self, url):
        self.url = url
        self.podcast = {}
        self.parsed_feed = self.parse_feed(self.url) 
        self.feed = feed = self.parsed_feed.feed


    def get_podcast_data(self):

        is_valid_feed = self.feed_is_valid(self.url)

        if is_valid_feed:
            self.get_podcast_info()
            self.get_episodes()

            return self.podcast
        else:
            raise Exception('feed inválido')
            

    def get_podcast_info(self):

        if 'title' in self.feed:
            self.podcast['name'] = self.feed.title
        
        if 'language' in self.feed:
            self.podcast['language'] = self.feed.language.lower()
        
        if 'media_thumbnail' in self.feed:
            self.podcast['image'] = self.feed.media_thumbnail[0]['url']

        
    def get_episodes(self):
        self.podcast['items'] = []

        entries = self.parsed_feed.entries

        for entry in entries:

            if self.episode_is_valid(entry):

                item = {}

                item['title'] = entry.title
                item['enclosure'] = entry.enclosures[0].href
                item['published'] = self.formatDateTime(entry.published)
            
                if 'link' in entry:
                    item['link'] = entry.link
                else:
                    item['link'] = ''

                description = self.remove_html_tags(entry.description)
            
                item['description'] = description
                
                if 'tags' in entry:
                    item['tags'] = self.get_tags(entry.tags)
                else:
                    item['tags'] = []

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

        if self.feed_is_valid(feed):
            return feed
        else:
            raise Exception('erro no feed rss')

    def feed_is_valid(self, feed):
        if hasattr(feed, 'bozo_exception'):
            raise feed.bozo_exception
        else:
            return True
            


    def episode_is_valid(self, episode):
        attributes = ['enclosures', 'published', 'title'] 
        
        for attribute in attributes:
            if attribute not in episode:
                return False
        
        return True

    def published_date_is_valid(self, published_date):
        try:
            datetime.strptime(published_date, "%a, %d %b %Y %H:%M:%S %Z")
            return True
        except ValueError:
            return False

    def formatDateTime(self, input_datetime):
        
        input_format = '%a, %d %b %Y %H:%M:%S %Z'
        output_format = '%Y-%m-%d'
        parsed_datetime = maya.parse(input_datetime)

        formated_date = datetime.strptime(str(parsed_datetime), input_format) \
                            .strftime(output_format)

        return formated_date
