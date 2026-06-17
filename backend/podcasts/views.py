from typing import ClassVar

from accounts.permissions import IsEditorOrAdmin
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Episode, Podcast, PodcastLanguage, PopularTerm, TopicSuggestion
from .serializers import (
    EpisodeSerializer,
    PodcastDetailSerializer,
    PodcastLanguageSerializer,
    PodcastListSerializer,
    PopularTermSerializer,
    TopicSuggestionSerializer,
)
from .services.podcast_service import PodcastService

_READ_ACTIONS = ("list", "retrieve")


class PodcastPagination(PageNumberPagination):
    """Pagination for podcasts with page_size=20 (T010)."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PodcastViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and creating Podcasts (T010, T011)."""

    queryset: ClassVar = Podcast.objects.all().order_by("-id")
    filter_backends: ClassVar = [filters.SearchFilter, DjangoFilterBackend]
    search_fields: ClassVar = ["name"]
    filterset_fields: ClassVar = ["language"]
    pagination_class = PodcastPagination

    def get_permissions(self):
        """Return AllowAny for read actions; require IsEditorOrAdmin for writes."""
        if self.action in _READ_ACTIONS:
            return [AllowAny()]
        return [IsEditorOrAdmin()]

    def get_serializer_class(self):
        """Return the serializer class based on the action."""
        if self.action in ["list"]:
            return PodcastListSerializer
        return PodcastDetailSerializer

    def create(self, request):
        """Create a Podcast from JSON request data and enqueue episode import.

        Parameters:
            request (rest_framework.request.Request): Expect `request.data` to include
                `name` (string) and `feed` (URL or string).

        Returns:
            rest_framework.response.Response:
                - 201 with `{"id": <int>, "status": "created"}` when a new
                  Podcast is created.
                - 200 with `{"id": <int>, "message": "...", "status": "existing"}`
                  when already exists.
                - 400 with `{"message": "..."}` on validation error.
        """
        result = PodcastService.create_podcast(
            name=request.data.get("name"), feed=request.data.get("feed")
        )

        if result["status"] == "error":
            return Response(
                {"message": result["message"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if result["status"] == "existing":
            return Response(
                {
                    "id": result["id"],
                    "message": result["message"],
                    "status": "none",  # compatibility with frontend expected status
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"id": result["id"], "status": "created"}, status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Return the six most recently created podcasts.

        Returns:
            Response: Serialized list of up to six Podcast objects ordered by
                descending `id`.
        """
        _ = request
        recent_podcasts = Podcast.objects.order_by("-id")[:6]
        serializer = PodcastListSerializer(recent_podcasts, many=True)
        return Response(serializer.data)


class EpisodeViewSet(viewsets.ModelViewSet):
    """Episode viewset with PostgreSQL full-text search support.

    Use `GET /api/episodes/?q=termo` to search episodes by title and description.
    """

    queryset: ClassVar = Episode.objects.all().order_by("-published")
    serializer_class: ClassVar = EpisodeSerializer
    filter_backends: ClassVar = [DjangoFilterBackend]
    filterset_fields: ClassVar = ["podcast"]

    def get_permissions(self):
        """Return AllowAny for read actions; require IsEditorOrAdmin for writes."""
        if self.action in _READ_ACTIONS:
            return [AllowAny()]
        return [IsEditorOrAdmin()]

    def get_queryset(self):
        """Return the queryset, optionally filtered by search term."""
        qs = super().get_queryset()
        q = self.request.query_params.get("q") or self.request.query_params.get(
            "search"
        )

        if q:
            return Episode.objects.search(q)

        return qs


class PodcastLanguageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for listing available podcast languages (T012)."""

    queryset: ClassVar = PodcastLanguage.objects.all().order_by("name")
    serializer_class: ClassVar = PodcastLanguageSerializer
    permission_classes: ClassVar = [AllowAny]
    pagination_class = None


class TopicSuggestionViewSet(viewsets.ModelViewSet):
    """ViewSet for handling Topic Suggestions."""

    queryset: ClassVar = TopicSuggestion.objects.all().order_by("-id")
    serializer_class: ClassVar = TopicSuggestionSerializer

    def get_permissions(self):
        """Return AllowAny for read actions; require IsEditorOrAdmin for writes."""
        if self.action in _READ_ACTIONS:
            return [AllowAny()]
        return [IsEditorOrAdmin()]


class PopularTermViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing Popular Terms."""

    queryset: ClassVar = PopularTerm.objects.all().order_by("-times")
    serializer_class: ClassVar = PopularTermSerializer
