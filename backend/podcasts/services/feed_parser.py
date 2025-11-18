import logging
import re
from typing import Any, Dict, List, Optional

import feedparser

logger = logging.getLogger(__name__)

# Rough HTML tag stripper (keeps text content). For more robust needs consider BeautifulSoup.
_TAG_RE = re.compile(r"(<!--.*?-->|<[^>]*>)", re.DOTALL)


def _strip_html(text: Optional[str]) -> str:
    if not text:
        return ""
    return _TAG_RE.sub("", text).strip()


def parse_feed(url: str, default_image: str = "/static/dist/img/podcast-banner.png") -> Dict[str, Any]:
    """Parse an RSS/Atom feed and return a normalized dict.

    Returns a dict with keys: title, language, image, items (list of dicts).
    Each item has: title, link, published, description, tags, enclosure.

    This is intentionally forgiving: on parse errors we return an empty dict and log the exception.
    """
    try:
        d = feedparser.parse(url)

        result: Dict[str, Any] = {
            "title": d.feed.get("title", "") if hasattr(d, "feed") else "",
            "language": d.feed.get("language", "").lower() if hasattr(d, "feed") and d.feed.get("language") else "",
            "image": d.feed.get("image", {}).get("href") if hasattr(d, "feed") and d.feed.get("image") else default_image,
            "items": [],
        }

        entries = getattr(d, "entries", []) or []
        for entry in entries:
            item: Dict[str, Any] = {}

            item["title"] = entry.get("title", "")
            item["link"] = entry.get("link", "")
            item["published"] = entry.get("published", "")
            item["description"] = _strip_html(entry.get("description", "") or entry.get("summary", ""))

            # tags
            tags: List[str] = []
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
    """Return True if the feed parses without bozo errors."""
    try:
        d = feedparser.parse(url)
        return getattr(d, "bozo", 1) == 0
    except Exception:
        return False
