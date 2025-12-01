import logging
import re
from typing import Any

import feedparser

logger = logging.getLogger(__name__)

# Rough HTML tag stripper (keeps text content). For more robust needs consider BeautifulSoup.
_TAG_RE = re.compile(r"(<!--.*?-->|<[^>]*>)", re.DOTALL)


def _strip_html(text: str | None) -> str:
    """Remove HTML tags and comments from the given text and trim leading/trailing whitespace.

    Parameters:
        text (str | None): Input text to clean.

    Returns:
        str: The cleaned text with HTML tags/comments removed and surrounding whitespace trimmed.
    """
    if not text:
        return ""
    return _TAG_RE.sub("", text).strip()


def parse_feed(
    url: str, default_image: str = "/static/dist/img/podcast-banner.png"
) -> dict[str, Any]:
    """Parse an RSS/Atom feed URL and produce a normalized feed dictionary.

    The returned dictionary contains:
    - title: feed title or empty string
    - language: feed language lowercased or empty string
    - image: feed image href or the provided default image
    - items: list of item dictionaries, each with:
      - title, link, published, description (HTML stripped)
      - optional `tags`: list of tag strings when present
      - optional `enclosure`: first enclosure href when present

    Parameters:
        url (str): The feed URL to parse.
        default_image (str): Fallback image URL used when the feed has no image.

    Returns:
        dict[str, Any]: A normalized feed dictionary as described above. Returns an empty dict on parse errors (the exception is logged).
    """
    try:
        d = feedparser.parse(url)

        result: dict[str, Any] = {
            "title": d.feed.get("title", "") if hasattr(d, "feed") else "",
            "language": d.feed.get("language", "").lower()
            if hasattr(d, "feed") and d.feed.get("language")
            else "",
            "image": d.feed.get("image", {}).get("href")
            if hasattr(d, "feed") and d.feed.get("image")
            else default_image,
            "items": [],
        }

        entries = getattr(d, "entries", []) or []
        for entry in entries:
            item: dict[str, Any] = {}

            item["title"] = entry.get("title", "")
            item["link"] = entry.get("link", "")
            item["published"] = entry.get("published", "")
            item["description"] = _strip_html(
                entry.get("description", "") or entry.get("summary", "")
            )

            # tags
            tags: list[str] = []
            for t in entry.get("tags", []) or []:
                # feedparser may expose tags as dicts with 'term' key
                term = None
                if isinstance(t, dict):
                    term = t.get("term")
                else:
                    term = getattr(t, "term", None)
                if term:
                    tags.append(term)
            if tags:
                item["tags"] = tags

            # enclosure (audio file)
            enclosure = ""
            encs = entry.get("enclosures", []) or []
            if encs:
                first = encs[0]
                if isinstance(first, dict):
                    enclosure = first.get("href", "")
                else:
                    enclosure = getattr(first, "href", "")
            if enclosure:
                item["enclosure"] = enclosure

            result["items"].append(item)

        return result

    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Failed to parse feed %s: %s", url, exc)
        return {}


def is_valid_feed(url: str) -> bool:
    """Check whether a feed URL parses without feedparser bozo errors.

    If parsing raises an exception, the feed is considered invalid.

    Parameters:
        url (str): The feed URL to validate.

    Returns:
        `true` if feedparser reports no bozo errors (`bozo == 0`), `false` otherwise (including when parsing raises an exception).
    """
    try:
        d = feedparser.parse(url)
        return getattr(d, "bozo", 1) == 0
    except Exception:
        return False
