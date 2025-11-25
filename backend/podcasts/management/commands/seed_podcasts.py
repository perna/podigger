from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from podcasts.models import (
    PodcastLanguage,
    PopularTerm,
    Tag,
    TopicSuggestion,
    Podcast,
    Episode,
)


class Command(BaseCommand):
    help = "Seed the database with example podcasts, episodes, tags and suggestions. Safe to run multiple times."

    def handle(self, *args, **options):
        now = timezone.now()

        with transaction.atomic():
            # Languages
            pt, _ = PodcastLanguage.objects.get_or_create(code="pt", defaults={"name": "português"})
            en, _ = PodcastLanguage.objects.get_or_create(code="en", defaults={"name": "English"})

            # Tags
            news_tag, _ = Tag.objects.get_or_create(name="news")
            tech_tag, _ = Tag.objects.get_or_create(name="tech")
            ai_tag, _ = Tag.objects.get_or_create(name="ai")

            # Podcasts
            dev_podcast, _ = Podcast.objects.get_or_create(
                name="Dev Talk",
                defaults={
                    "feed": "https://example.com/devtalk/feed",
                    "image": "/static/dist/img/podcast-banner.png",
                    "language": en,
                },
            )

            news_podcast, _ = Podcast.objects.get_or_create(
                name="Notícias Hoje",
                defaults={
                    "feed": "https://example.com/noticias/feed",
                    "image": "/static/dist/img/podcast-banner.png",
                    "language": pt,
                },
            )

            # Episodes for dev_podcast
            ep1, _ = Episode.objects.get_or_create(
                link="https://example.com/devtalk/1",
                defaults={
                    "title": "Welcome to Dev Talk",
                    "description": "Intro episode about the podcast",
                    "published": now,
                    "podcast": dev_podcast,
                },
            )
            ep1.tags.add(tech_tag)

            ep2, _ = Episode.objects.get_or_create(
                link="https://example.com/devtalk/2",
                defaults={
                    "title": "Python Tips",
                    "description": "Quick Python tips and tricks",
                    "published": now,
                    "podcast": dev_podcast,
                },
            )
            ep2.tags.add(tech_tag, ai_tag)

            # Episodes for news_podcast
            ne1, _ = Episode.objects.get_or_create(
                link="https://example.com/noticias/1",
                defaults={
                    "title": "Manchete do dia",
                    "description": "Resumo das principais notícias",
                    "published": now,
                    "podcast": news_podcast,
                },
            )
            ne1.tags.add(news_tag)

            # Popular terms
            PopularTerm.objects.get_or_create(
                term="python", defaults={"times": 10, "date_search": now.date()}
            )
            PopularTerm.objects.get_or_create(
                term="django", defaults={"times": 5, "date_search": now.date()}
            )

            # Topic suggestions
            TopicSuggestion.objects.get_or_create(
                title="Como testar APIs",
                defaults={"description": "Sugestões de tópicos para testar APIs", "is_recorded": False},
            )

        self.stdout.write(self.style.SUCCESS("Seed data created/verified."))
