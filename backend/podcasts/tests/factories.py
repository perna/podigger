import factory
from factory.django import DjangoModelFactory
from faker import Faker

from podcasts.models import Episode, Podcast

fake = Faker("pt_BR")


class PodcastFactory(DjangoModelFactory):
    """Factory para o modelo podcasts.Podcast."""

    class Meta:
        model = Podcast
        django_get_or_create = ("feed",)

    name = factory.LazyFunction(lambda: fake.unique.company())
    feed = factory.LazyFunction(
        lambda: f"https://feeds.example.com/{fake.unique.uuid4()}/feed.xml"
    )
    image = factory.LazyAttribute(lambda o: f"https://img.example.com/{o.name}.jpg")


class EpisodeFactory(DjangoModelFactory):
    """Factory para o modelo podcasts.Episode."""

    class Meta:
        model = Episode

    title = factory.LazyFunction(lambda: fake.sentence(nb_words=6))
    link = factory.LazyFunction(
        lambda: f"https://episodes.example.com/{fake.unique.uuid4()}"
    )
    description = factory.LazyFunction(lambda: fake.paragraph())
    podcast = factory.SubFactory(PodcastFactory)


def make_large_catalogue(
    podcasts: int = 200, episodes_per_podcast: int = 100
) -> tuple[list[Podcast], list[Episode]]:
    """Seed a large deterministic catalogue for performance tests.

    Reuses `BulkSeedMixin` so the seed is reproducible across CI runs.
    Returns `(podcasts, episodes)` lists.
    """
    from podcasts.tests._perf_fixtures import BulkSeedMixin

    podcast_objs = BulkSeedMixin.seed_podcasts(podcasts)
    all_episodes: list[Episode] = []
    for podcast in podcast_objs:
        all_episodes.extend(BulkSeedMixin.seed_episodes(podcast, episodes_per_podcast))
    return podcast_objs, all_episodes
