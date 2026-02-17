import datetime

from django.contrib.postgres.search import (
    SearchQuery,
    SearchRank,
    SearchVector,
    TrigramSimilarity,
)
from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
    """Abstract base model with timestamps."""

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(null=True, blank=True, auto_now=True)

    class Meta:
        """Meta options for BaseModel."""

        abstract = True


class PodcastLanguage(BaseModel):
    """Model representing a podcast language."""

    code = models.CharField(max_length=10, default="pt", blank=True, null=True)
    name = models.CharField(max_length=60, default="português", blank=True, null=True)

    def __str__(self):
        """Format the language's display label as "name (code)".

        Returns:
            str: The formatted label, e.g. "Português (pt)".
        """
        return f"{self.name} ({self.code})"


class Podcast(BaseModel):
    """Model representing a podcast feed."""

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
    """Tag for categorizing episodes."""

    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        """Provide the model instance's name as its string representation.

        Returns:
            str: The value of the instance's `name` field.
        """
        return self.name


class EpisodeManager(models.Manager):
    """Manager for the Episode model with custom search functionality."""

    def search(self, query: str):
        """Search episodes by title and description using Full Text Search.

        Falls back to Trigram Similarity if no FTS matches found.
        """
        if not query:
            return self.get_queryset()

        # Update popular terms
        term, created = PopularTerm.objects.get_or_create(
            term=query, defaults={"times": 1}
        )
        if not created:
            PopularTerm.objects.filter(pk=term.pk).update(times=models.F("times") + 1)

        # Config for Portuguese search
        config = "portuguese"

        # Search Vectors
        vector = SearchVector("title", weight="A", config=config) + SearchVector(
            "description", weight="B", config=config
        )
        search_query = SearchQuery(query, config=config)

        # Base queryset with annotations
        qs = self.get_queryset().annotate(
            rank=SearchRank(vector, search_query),
            trigram=TrigramSimilarity("title", query),
        )

        # FTS results
        fts_results = qs.filter(rank__gt=0).order_by("-rank", "-published")
        if fts_results.exists():
            return fts_results

        # Fallback to Trigram
        return qs.filter(trigram__gt=0.1).order_by("-trigram", "-published")


class Episode(models.Model):
    """Model representing a podcast episode."""

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

    objects = EpisodeManager()

    def __str__(self):
        """Represent the topic suggestion by its title.

        Returns:
            str: The topic suggestion title used as the object's string representation.
        """
        return self.title


class PopularTerm(BaseModel):
    """Model related to search analytics for popular terms."""

    term = models.CharField(max_length=255, db_index=True)
    times = models.IntegerField(default=1)
    date_search = models.DateField(default=datetime.date.today)

    def __str__(self):
        """Format the popular term with its occurrence count.

        Returns:
            str: The term and count in the format "<term> (<times>)".
        """
        return f"{self.term} ({self.times})"


class TopicSuggestion(BaseModel):
    """Model for suggested topics."""

    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    is_recorded = models.BooleanField(default=False)

    def __str__(self):
        """Represent the episode by its title.

        Returns:
            str: The episode title used as the object's string representation.
        """
        return self.title
