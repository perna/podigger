from django.db import models
from django.contrib.postgres.field import ArrayField
from django.utils import timezone

class BaseModel(models.Model):
    created_at = models.DateTimeField("Created at", auto_now_add=True)
    updated_at = models.DateTimeField("Updated at", auto_now=True)

    class Meta:
        abstract = True


class Podcast(BaseModel):
    name = models.CharField("name", max_length=128)
    feed = models.URLField("feed", unique=True)
    image = models.CharField("thumbnail", max_length=200, \
                                default="/static/dist/img/podcast-banner.png")
    last_feed_update = models.DateTimeField("Last update", default=timezone.now)

    class Meta:
        db_table = "podcast"
        verbose_name = "Podcast"
        verbose_name_plural = "Podcasts"

    def __str__(self):
        return self.name


class Episode(BaseModel):
    title = models.CharField("title", max_length=255)
    permalink = models.URLField("permalink")
    description = models.TextField("description")
    published_at = models.DateField("published at", blank=True)
    permalink = models.URLField("permalink")
    tags = ArrayField(models.CharField(max_length=128), blank=True)

    class Meta:
        db_table = 'episode'
        verbose_name = "Episode"
        verbose_name_plural = "Episodes"


class PopularTerm(BaseModel):
    term = models.TextField("Term searched")
    times = models.IntegerField("number of times", default=1)
    date_search = models.DateTimeField("Date of search", auto_now_add=True)

    class Meta:
        db_table = 'popular_term'
        verbose_name = "Popular Term"
        verbose_name_plural = "Popular Terms"


    def __str__(self):
        return self.term



