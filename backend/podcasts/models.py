import datetime

from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(null=True, blank=True, auto_now=True)

    class Meta:
        abstract = True


class PodcastLanguage(BaseModel):
    code = models.CharField(max_length=10, default="pt", blank=True, null=True)
    name = models.CharField(max_length=60, default="português", blank=True, null=True)

    def __str__(self):
        """
        Format the language's display label as "name (code)".

        Returns:
            str: The formatted label, e.g. "Português (pt)".
        """
        return f"{self.name} ({self.code})"


class Podcast(BaseModel):
    name = models.CharField(max_length=128, unique=True)
    feed = models.URLField(unique=True)
    image = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        default="/static/dist/img/podcast-banner.png",
    )
    language = models.ForeignKey(
        PodcastLanguage, on_delete=models.SET_NULL, null=True, default=None
    )
    total_episodes = models.IntegerField(default=0)

    def __str__(self):
        """Provide the model instance's name as its string representation.

        Returns:
            str: The value of the instance's `name` field.
        """
        return self.name


class Tag(BaseModel):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        """Provide the model instance's name as its string representation.

        Returns:
            str: The value of the instance's `name` field.
        """
        return self.name


class Episode(models.Model):
    title = models.CharField(max_length=1024)
    link = models.URLField(unique=True)
    description = models.TextField(blank=True, null=True)
    published = models.DateTimeField(null=True, blank=True)
    enclosure = models.CharField(max_length=1024, blank=True, null=True)
    to_json = models.JSONField(null=True, blank=True)
    podcast = models.ForeignKey(
        Podcast, related_name="episodes", on_delete=models.CASCADE
    )
    tags = models.ManyToManyField(Tag, related_name="episodes", blank=True)

    def __str__(self):
        """Represent the topic suggestion by its title.

        Returns:
            str: The topic suggestion title used as the object's string representation.
        """
        return self.title


class PopularTerm(BaseModel):
    term = models.CharField(max_length=255, db_index=True)
    times = models.IntegerField(default=1)
    date_search = models.DateField(default=datetime.date.today)

    def __str__(self):
        """
        Format the popular term with its occurrence count.

        Returns:
            str: The term and count in the format "<term> (<times>)".
        """
        return f"{self.term} ({self.times})"


class TopicSuggestion(BaseModel):
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    is_recorded = models.BooleanField(default=False)

    def __str__(self):
        """Represent the episode by its title.

        Returns:
            str: The episode title used as the object's string representation.
        """
        return self.title
