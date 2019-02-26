from .models import Podcast
from django.db.models.signals import post_save
from django.dispatch import receiver

from .tasks import updateEpisodes

@receiver(post_save, sender=Podcast)
def callUpdateEpisodesTask(sender, instance, **kwargs):
    updateEpisodes(instance)
