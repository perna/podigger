from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from podcasts.tasks import add_episode

from .models import Podcast


@receiver(post_save, sender=Podcast)
def dispatch_add_episode(sender, instance, created, **_kwargs):  # noqa: ARG001
    if created and instance.feed:
        feed_url = instance.feed
        transaction.on_commit(lambda: add_episode.delay(feed_url))
