import logging
import time

from django.db import transaction

from podcasts.models import Episode, Podcast, PodcastLanguage, Tag

from .feed_parser import parse_feed

logger = logging.getLogger(__name__)


class EpisodeUpdater:
    def __init__(self, feeds):
        """
        Initialize the updater with the list of feed URLs to process.
        
        Parameters:
            feeds (Iterable[str]): An iterable of podcast feed URLs that populate will process.
        """
        self.feeds = feeds

    def populate(self):
        """
        Synchronizes podcasts and their episodes from the instance's feed URLs.
        
        For each feed URL, updates the matching Podcast's image and language, creates Episode records for new items, and creates/associates Tag records for episode tags. Skips feeds with no matching Podcast, skips items whose published date is invalid, and skips episodes whose link already exists. Each feed is processed atomically; failures for one feed are logged and do not stop processing of other feeds.
        """
        for feed_url in self.feeds:
            try:
                with transaction.atomic():
                    podcast_obj = Podcast.objects.filter(feed=feed_url).first()
                    if not podcast_obj:
                        logger.warning("Podcast com feed %s não encontrado.", feed_url)
                        continue

                    parsed_podcast = parse_feed(feed_url)

                    podcast_obj.image = parsed_podcast.get("image")

                    lang_code = parsed_podcast.get("language")
                    if lang_code:
                        language, _ = PodcastLanguage.objects.get_or_create(
                            code=lang_code
                        )
                        podcast_obj.language = language

                    podcast_obj.save()

                    for item in parsed_podcast.get("items", []):
                        try:
                            published_str = item.get("published", "")
                            time.strptime(published_str[:25], "%a, %d %b %Y %H:%M:%S")
                        except (ValueError, TypeError):
                            logger.warning(
                                "Formato de data inválido para o episódio: %s",
                                item.get("title"),
                            )
                            continue

                        if Episode.objects.filter(link=item.get("link")).exists():
                            continue

                        new_episode = Episode.objects.create(
                            title=item.get("title"),
                            link=item.get("link"),
                            description=item.get("description"),
                            published=item.get("published"),
                            enclosure=item.get("enclosure"),
                            podcast=podcast_obj,
                            to_json=item,
                        )

                        tag_list = []
                        for tag_name in item.get("tags", []):
                            tag, _ = Tag.objects.get_or_create(name=tag_name)
                            tag_list.append(tag)

                        if tag_list:
                            new_episode.tags.add(*tag_list)

            except Exception as e:
                logger.error("Falha ao processar o feed %s: %s", feed_url, e)