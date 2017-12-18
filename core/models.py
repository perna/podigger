from django.db import models
from django.utils import timezone

class Podcast(models.Model):
    name = models.CharField("Podcast name", max_length=128)
    feed = models.URLField("Podcast feed", unique=True)
    image = models.CharField("Podcast thumbnail", max_length=200, \
                                default="/static/dist/img/podcast-banner.png")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_feed_update = models.DateTimeField( default=timezone.now)

    class Meta:
        db_table = "podcast"
        verbose_name = "Podcast"
        verbose_name_plural = "Podcasts"

    def __str__(self):
        return self.name


