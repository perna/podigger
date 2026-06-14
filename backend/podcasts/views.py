from typing import ClassVar

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.permissions import IsEditorOrAdmin

<<<<<<< HEAD
from .models import Episode, Podcast, PodcastLanguage, PopularTerm, TopicSuggestion
=======
from .models import Episode, Podcast, PopularTerm
>>>>>>> e07ed9a (refactor: improve backend API with better search and validation)
from .serializers import (
    EpisodeSerializer,
    PodcastDetailSerializer,
    PodcastLanguageSerializer,
    PodcastListSerializer,
    PodcastUpdateSerializer,
    PopularTermSerializer,
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
<<<<<<< HEAD
    pagination_class = PodcastPagination
=======
>>>>>>> e07ed9a (refactor: improve backend API with better search and validation)

    def get_permissions(self):
        """Return AllowAny for read actions; require IsEditorOrAdmin for writes."""
        if self.action in _READ_ACTIONS:
            return [AllowAny()]
        return [IsEditorOrAdmin()]

    def get_serializer_class(self):
        """Return the serializer class based on the action."""
        if self.action in ["list"]:
            return PodcastListSerializer
        if self.action in ["update", "partial_update"]:
            return PodcastUpdateSerializer
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

    def update(self, request, *args, **kwargs):  # noqa: ARG002
        """Update a podcast with optional feed change detection.

        Parameters:
            request (rest_framework.request.Request): The update request.
            *args: Positional arguments passed to parent.
            **kwargs: Keyword arguments passed to parent.

        Returns:
            rest_framework.response.Response: Updated podcast data.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        new_feed = serializer.validated_data.get("feed")
        if new_feed and new_feed != instance.feed:
            PodcastService.update_podcast_feed(instance, new_feed)
            serializer.validated_data.pop("feed", None)

        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Partially update a podcast with optional feed change detection.

        Parameters:
            request (rest_framework.request.Request): The update request.
            *args: Positional arguments passed to parent.
            **kwargs: Keyword arguments passed to parent.

        Returns:
            rest_framework.response.Response: Updated podcast data.
        """
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

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


class PopularTermViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing Popular Terms."""

    queryset: ClassVar = PopularTerm.objects.all().order_by("-times")
    serializer_class: ClassVar = PopularTermSerializer
