import feedparser
import re
import json


def get_episodes(url):

    podcast = {}
    d = feedparser.parse(url)
    no_tag = re.compile((r'(<!--.*?-->|<[^>]*>)'))

    if 'title' in d.feed:
        podcast['title'] = d.feed.title
        print(podcast['title'])
    else:
        podcast['title'] = 'sem título'
        print(podcast['title'])

    podcast['items'] = []

    for entry in d.entries:
        item = {}
        tags = []
        item['title'] = entry.title
        item['link'] = entry.link
        item['published'] = entry.published

        description = no_tag.sub('', entry.description)

        item['description'] = description

        if 'tags' in entry:
            for t in entry.tags:
                tags.append(t.term)

            item['tags'] = tags

        if entry.enclosures:
            item['enclosure'] = entry.enclosures[0].href

        podcast['items'].append(item)

    return json.dumps(podcast)


def is_valid_feed(url):
    d = feedparser.parse(url)
    if d.bozo == 0:
       return True
    else:
        error = d.bozo_exception
        error_message = {'error': error.getMessage(), 'line': error.getLineNumber()}
        return json.dumps(error_message)

