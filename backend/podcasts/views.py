from django.contrib.postgres.search import (
    SearchQuery,
    SearchRank,
    SearchVector,
    TrigramSimilarity,
)
from django.db.models import F

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Episode, Podcast, PopularTerm, TopicSuggestion
from .serializers import (
    EpisodeSerializer,
    PodcastSerializer,
    PopularTermSerializer,
    TopicSuggestionSerializer,
)
from .services.feed_parser import is_valid_feed
from .tasks import add_episode


class PodcastViewSet(viewsets.ModelViewSet):
    queryset = Podcast.objects.all().order_by("-id")
    serializer_class = PodcastSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def create(self, request):
        """
        Create a Podcast from JSON request data and enqueue episode import.

        Parameters:
            request (rest_framework.request.Request): Expect `request.data` to include `name` (string) and `feed` (URL or string).

        Returns:
            rest_framework.response.Response:
                - 201 with `{"id": <int>, "status": "created"}` when a new Podcast is created.
                - 200 with `{"id": <int>, "message": "este podcast já foi adicionado", "status": "none"}` when a Podcast with the same `feed` already exists.
                - 400 with `{"message": "o nome e o feed são obrigatórios"}` when `name` or `feed` is missing.

        Side effects:
            Enqueues a background task to import episodes for the provided `feed`.
        """
        name = request.data.get("name")
        feed = request.data.get("feed")

        if not name or not feed:
            return Response(
                {"message": "o nome e o feed são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not is_valid_feed(feed):
            return Response(
                {"message": "o feed informado é inválido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Atomic lookup to avoid race condition between exists/get/create
        podcast, created = Podcast.objects.get_or_create(
            feed=feed, defaults={"name": name}
        )

        if not created:
            # Podcast already exists
            return Response(
                {
                    "id": podcast.id,
                    "message": "este podcast já foi adicionado",
                    "status": "none",
                },
                status=status.HTTP_200_OK,
            )

        # New podcast created - trigger async task
        add_episode.delay(feed)

        return Response(
            {"id": podcast.id, "status": "created"}, status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """
        Return the six most recently created podcasts.

        Returns:
            Response: Serialized list of up to six Podcast objects ordered by descending `id`.
        """
        _ = request
        recent_podcasts = Podcast.objects.order_by("-id")[:6]
        serializer = self.get_serializer(recent_podcasts, many=True)
        return Response(serializer.data)


class EpisodeViewSet(viewsets.ModelViewSet):
    """Episode viewset with PostgreSQL full-text search support.

    Use `GET /api/episodes/?q=termo` to search episodes by title and description.
    Results are ordered by relevance using SearchRank and fallback to trigram similarity
    for partial matches.
    """

    queryset = Episode.objects.all().order_by("-published")
    serializer_class = EpisodeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["podcast"]

    def get_queryset(self):
        """
        Return the episodes queryset, applying full-text search and relevance ordering when a search term is provided.
        
        If the `q` or `search` query parameter is present, record the term in PopularTerm, perform a PostgreSQL full-text search (Portuguese configuration) over title and description and annotate results with a text-search rank and a trigram similarity on the title. Return episodes with a positive text-search rank ordered by rank then published date; if no rank matches are found, fall back to trigram matches (threshold 0.1) ordered by trigram then published date.
        
        Returns:
            QuerySet: Episode objects filtered and ordered according to the presence and relevance of the search term.
        """
        qs = super().get_queryset()
        q = self.request.query_params.get("q") or self.request.query_params.get(
            "search"
        )
        if not q:
            return qs

        # Save search term
        term, created = PopularTerm.objects.get_or_create(
            term=q, defaults={"times": 1}
        )
        if not created:
            PopularTerm.objects.filter(pk=term.pk).update(times=F("times") + 1)

        # Full-text search across title and description using Portuguese config.
        # Use the same text search configuration as the index so Postgres can use the GIN index.
        vector = SearchVector("title", weight="A", config="portuguese") + SearchVector(
            "description", weight="B", config="portuguese"
        )
        query = SearchQuery(q, config="portuguese")

        # Annotate rank and trigram similarity (for partial matches)
        annotated = qs.annotate(
            rank=SearchRank(vector, query),
            trigram=TrigramSimilarity(F("title"), q),
        )

        # Prefer rows with rank>0, but include trigram matches too; combine ordering
        result = annotated.filter(rank__gt=0).order_by("-rank", "-published")

        # If no rank matches, fallback to trigram similarity
        if not result.exists():
            result = annotated.filter(trigram__gt=0.1).order_by(
                "-trigram", "-published"
            )

        return result


class TopicSuggestionViewSet(viewsets.ModelViewSet):
    queryset = TopicSuggestion.objects.all().order_by("-id")
    serializer_class = TopicSuggestionSerializer


class PopularTermViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PopularTerm.objects.all().order_by("-times")
    serializer_class = PopularTermSerializer