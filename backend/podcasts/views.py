from rest_framework import viewsets
from rest_framework.response import Response
from django.db.models import F
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank, TrigramSimilarity

from .models import Podcast, Episode, TopicSuggestion
from .serializers import PodcastSerializer, EpisodeSerializer, TopicSuggestionSerializer


class PodcastViewSet(viewsets.ModelViewSet):
    queryset = Podcast.objects.all().order_by('-id')
    serializer_class = PodcastSerializer


class EpisodeViewSet(viewsets.ModelViewSet):
    """Episode viewset with PostgreSQL full-text search support.

    Use `GET /api/episodes/?q=termo` to search episodes by title and description.
    Results are ordered by relevance using SearchRank and fallback to trigram similarity
    for partial matches.
    """

    queryset = Episode.objects.all().order_by('-published')
    serializer_class = EpisodeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q') or self.request.query_params.get('search')
        if not q:
            return qs

        # Full-text search across title and description using Portuguese config.
        # Use the same text search configuration as the index so Postgres can use the GIN index.
        vector = SearchVector('title', weight='A', config='portuguese') + SearchVector('description', weight='B', config='portuguese')
        query = SearchQuery(q, config='portuguese')

        # Annotate rank and trigram similarity (for partial matches)
        annotated = qs.annotate(
            rank=SearchRank(vector, query),
            trigram=TrigramSimilarity(F('title'), q),
        )

        # Prefer rows with rank>0, but include trigram matches too; combine ordering
        result = annotated.filter(rank__gt=0).order_by('-rank', '-published')

        # If no rank matches, fallback to trigram similarity
        if not result.exists():
            result = annotated.filter(trigram__gt=0.1).order_by('-trigram', '-published')

        return result


class TopicSuggestionViewSet(viewsets.ModelViewSet):
    queryset = TopicSuggestion.objects.all().order_by('-id')
    serializer_class = TopicSuggestionSerializer
