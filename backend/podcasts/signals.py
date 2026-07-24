from django.db.models.signals import post_save
from django.dispatch import receiver

from podcasts.tasks import add_episode

from .models import Podcast


@receiver(post_save, sender=Podcast)
def dispatch_add_episode(_sender, instance, created, **_kwargs):
    if created and instance.feed:
        add_episode.delay(instance.feed)
