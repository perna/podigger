import random

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from podcasts.models import (
    Episode,
    Podcast,
    PodcastLanguage,
    PopularTerm,
    Tag,
    TopicSuggestion,
)


class Command(BaseCommand):
    help = (
        "Seed the database with many fake podcasts and episodes. "
        "Use --podcasts and --episodes to control numbers. Pass --force to run large jobs."
    )

    def add_arguments(self, parser):
        """Add command-line options that control seeding behavior for the management command.

        Parameters:
            parser (argparse.ArgumentParser): Django-provided argument parser to which options are added.

        Options:
            --podcasts (int, default=100): Number of podcasts to create.
            --episodes (int, default=100): Number of episodes to create per podcast.
            --avg-tags (int, default=3): Average number of tags to attach to each episode.
            --tag-pool (int, default=500): Number of unique tag names to pre-create for sampling.
            --locale (str, default="pt_BR"): Faker locale to use for generated data (e.g., "pt_BR", "en_US").
            --force (flag): Bypass the safety check that prevents large dataset creation.
        """
        parser.add_argument(
            "--podcasts", type=int, default=100, help="Number of podcasts to create"
        )
        parser.add_argument(
            "--episodes", type=int, default=100, help="Episodes per podcast"
        )
        parser.add_argument(
            "--avg-tags", type=int, default=3, help="Average tags per episode"
        )
        parser.add_argument(
            "--tag-pool", type=int, default=500, help="Unique tag pool size"
        )
        parser.add_argument(
            "--locale",
            type=str,
            default="pt_BR",
            help="Faker locale (pt_BR, en_US, etc.)",
        )
        parser.add_argument(
            "--force", action="store_true", help="Confirm creation of large datasets"
        )

    def handle(self, *args, **options):
        """Seed the database with fake podcasts, episodes, tags, and related metadata based on command-line options.

        Performs all writes inside a single database transaction. If the estimated work is large (more than 2000 total episodes) and `force` is not set, the command prints a warning and exits without making changes.

        Parameters:
            options (dict): Command options and their meanings:
                - "podcasts": number of podcasts to create.
                - "episodes": number of episodes to create per podcast.
                - "avg_tags": target average number of tags per episode (used as the mean for Gaussian sampling; at least 1 tag is assigned).
                - "tag_pool": number of unique tag names to pre-create.
                - "locale": Faker locale to use for generated data.
                - "force": boolean flag to bypass the safety check for large seeds.

        Side effects:
            - Ensures PodcastLanguage entries for Portuguese ("pt") and English ("en") exist.
            - Creates Tag, Podcast, Episode, through-model tag links, PopularTerm, and TopicSuggestion records in bulk.
            - Uses bulk_create and chunked inserts for performance; ignores conflicts where appropriate.
        """
        _ = args
        podcasts_count = options["podcasts"]
        episodes_per = options["episodes"]
        avg_tags = options["avg_tags"]
        tag_pool_size = options["tag_pool"]
        locale = options["locale"]
        force = options["force"]

        total_episodes = podcasts_count * episodes_per
        est_m2m = total_episodes * avg_tags

        if not force and total_episodes > 2000:
            self.stdout.write(
                self.style.WARNING(
                    f"This will create {podcasts_count} podcasts and {total_episodes} episodes (~{est_m2m} tag links). "
                    "Pass --force to proceed."
                )
            )
            return

        fake = Faker(locale)
        now = timezone.now()

        self.stdout.write(
            f"Seeding {podcasts_count} podcasts x {episodes_per} episodes (total {total_episodes})..."
        )

        with transaction.atomic():
            # Ensure languages
            pt, _ = PodcastLanguage.objects.get_or_create(
                code="pt", defaults={"name": "português"}
            )
            en, _ = PodcastLanguage.objects.get_or_create(
                code="en", defaults={"name": "English"}
            )

            # Create tag pool
            existing_tags = set(Tag.objects.values_list("name", flat=True))
            tags_to_create = []
            tag_names = []
            for _ in range(tag_pool_size):
                name = fake.word().lower()
                retries = 0
                while name in existing_tags or name in tag_names:
                    name = fake.word().lower() + str(random.randint(1, 9999))
                    retries += 1
                    if retries > 100:
                        name = f"tag_{len(tag_names)}_{random.randint(1, 99999)}"
                        break
                tag_names.append(name)
                tags_to_create.append(Tag(name=name))

            Tag.objects.bulk_create(tags_to_create, ignore_conflicts=True)
            tags_qs = list(Tag.objects.filter(name__in=tag_names))
            tag_map = {t.name: t for t in tags_qs}

            # Create podcasts in bulk
            podcasts = []
            for _ in range(podcasts_count):
                lang = random.choice([pt, en])
                name = fake.unique.company()[:128]
                feed = f"https://example.com/{fake.slug()}/feed"
                podcasts.append(
                    Podcast(
                        name=name,
                        feed=feed,
                        image="/static/dist/img/podcast-banner.png",
                        language=lang,
                    )
                )

            # bulk_create returns the created objects with IDs populated (Django 4.0+)
            podcasts = Podcast.objects.bulk_create(podcasts)

            # Create episodes in chunks
            episodes = []
            for podcast in podcasts:
                for _ in range(episodes_per):
                    title = fake.sentence(nb_words=6)[:1024]
                    link = f"https://example.com/{fake.slug()}/{fake.uuid4()}"
                    desc = fake.paragraph(nb_sentences=3)
                    episodes.append(
                        Episode(
                            title=title,
                            link=link,
                            description=desc,
                            published=now,
                            podcast=podcast,
                        )
                    )

            # bulk create episodes in manageable chunks
            chunk = 1000
            for i in range(0, len(episodes), chunk):
                batch = episodes[i : i + chunk]
                Episode.objects.bulk_create(batch)

            # Attach tags via through model (bulk)
            through = Episode.tags.through
            m2m_rows = []
            tag_list = list(tag_map.values())
            # iterate through recently created episodes
            created_episodes_qs = Episode.objects.order_by("-id")[:total_episodes]
            for ep in created_episodes_qs:
                k = max(1, int(random.gauss(avg_tags, 1)))
                k = min(k, len(tag_list))
                tags_for_ep = random.sample(tag_list, k=k)
                for t in tags_for_ep:
                    m2m_rows.append(through(episode_id=ep.id, tag_id=t.id))

            # bulk insert m2m in chunks
            for i in range(0, len(m2m_rows), 2000):
                through.objects.bulk_create(
                    m2m_rows[i : i + 2000], ignore_conflicts=True
                )

            # Create a few popular terms and topic suggestions
            PopularTerm.objects.get_or_create(
                term="python", defaults={"times": 100, "date_search": now.date()}
            )
            PopularTerm.objects.get_or_create(
                term="django", defaults={"times": 80, "date_search": now.date()}
            )
            for _ in range(5):
                TopicSuggestion.objects.get_or_create(
                    title=fake.sentence(nb_words=4),
                    defaults={"description": fake.paragraph(), "is_recorded": False},
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created ~{len(podcasts)} podcasts, {total_episodes} episodes, and attached tags."
            )
        )
