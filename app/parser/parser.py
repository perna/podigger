"""Compatibility wrapper for the legacy parser API.

This module keeps the old function names (`get_episodes`, `is_valid_feed`) but
delegates to the Django service implementation in `backend.podcasts.services`.
This allows gradual migration of consumers to the new service while keeping
backwards compatibility.
"""

from typing import Dict, Any

try:
    # Prefer the new Django service when available
    from backend.podcasts.services.feed_parser import parse_feed as _parse_feed, is_valid_feed as _is_valid_feed
except Exception:  # pragma: no cover - fallback for environments without backend package
    # Fallback: lazy import to avoid hard dependency in older environments
    def _parse_feed(url: str) -> Dict[str, Any]:
        import feedparser
        import re

        podcast = {}
        d = feedparser.parse(url)
        no_tag = re.compile((r'(<!--.*?-->|<[^>]*>)'))

        try:
            if 'title' in d.feed:
                podcast['title'] = d.feed.title
            if 'language' in d.feed:
                podcast['language'] = d.feed.language.lower()
            if 'image' in d.feed:
                podcast['image'] = d.feed.image.href
            else:
                podcast['image'] = '/static/dist/img/podcast-banner.png'

            podcast['items'] = []

            for entry in d.entries:
                if 'link' in entry:
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

            return podcast
        except Exception:
            return {}

    def _is_valid_feed(url: str) -> bool:
        import feedparser

        d = feedparser.parse(url)
        return getattr(d, 'bozo', 1) == 0


def get_episodes(url: str) -> Dict[str, Any]:
    """Return parsed feed data in the legacy shape by delegating to the service."""
    return _parse_feed(url)


def is_valid_feed(url: str) -> bool:
    return _is_valid_feed(url)
