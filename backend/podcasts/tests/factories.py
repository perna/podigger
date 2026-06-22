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
