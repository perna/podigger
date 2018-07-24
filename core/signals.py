from .models import Podcast
from django.db.models.signals import post_save
from django.dispatch import receiver
from .updater import EpisodeUpdater
from .tasks import hello_task

@receiver(post_save, sender=Podcast)
def loadFeed(sender, instance, **kwargs):
    print(instance)
    print(instance.name)
    print(instance.feed)
    print(sender)

    hello_task.delay()

    updater = EpisodeUpdater(instance.feed)
    updater.populate()
