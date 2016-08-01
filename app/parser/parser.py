import feedparser
import re
import json


def get_episodes(url):
    podcast = {}
    d = feedparser.parse(url)
    no_tag = re.compile((r'(<!--.*?-->|<[^>]*>)'))

    try:
        if 'title' in d.feed:
            podcast['title'] = d.feed.title
            podcast['language'] = d.feed.language.lower()
            podcast['items'] = []

            print(d.feed.title)
            print(d.feed.language.lower())


        for entry in d.entries:

            if 'link' in entry:
                global item
                item = {}
                tags = []

                if 'title' in entry:
                    item['title'] = entry.title

                item['link'] = entry.link
                item['published'] = entry.published

                description = no_tag.sub('', entry.description)

                item['description'] = description

                if 'tags' in entry:
                    for t in entry.tags:
                        tags.append(t.term)

                    item['tags'] = tags

                if hasattr(entry, 'enclosures'):
                    if len(entry.enclosures) > 0:
                        item['enclosure'] = entry.enclosures[0].href

            podcast['items'].append(item)

        return json.dumps(podcast)
    except:
        pass


def is_valid_feed(url):
    d = feedparser.parse(url)
    if d.bozo == 0:
        return True
    else:
        error = d.bozo_exception
        error_message = {'error': error.getMessage(), 'line': error.getLineNumber()}
        return json.dumps(error_message)
