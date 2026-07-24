from django.contrib import admin

from .models import (
    Episode,
    Podcast,
    PodcastLanguage,
    PopularTerm,
    Tag,
    TopicSuggestion,
)


@admin.register(PodcastLanguage)
class PodcastLanguageAdmin(admin.ModelAdmin):
    """Admin for :class:`~podcasts.models.PodcastLanguage` instances.

    Provides search by name and displays the language code and label.
    """

    list_display = ("code", "name")
    search_fields = ("name",)


@admin.register(Podcast)
class PodcastAdmin(admin.ModelAdmin):
    """Admin for :class:`~podcasts.models.Podcast` instances.

    Displays name, language, episode count, and creation date. Filters by
    language and orders by most recent.
    """

    list_display = ("name", "language", "total_episodes", "created_at")
    list_filter = ("language",)
    search_fields = ("name",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Admin for :class:`~podcasts.models.Tag` instances.

    Displays the tag name with search support.
    """

    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    """Admin for :class:`~podcasts.models.Episode` instances.

    Displays title, podcast, and publish date. Filters by podcast and date,
    searches across title and description. Uses a raw ID widget for the
    podcast FK and a horizontal filter for tags.
    """

    list_display = ("title", "podcast", "published")
    list_filter = ("podcast", "published")
    search_fields = ("title", "description")
    ordering = ("-published",)
    raw_id_fields = ("podcast",)
    filter_horizontal = ("tags",)


@admin.register(PopularTerm)
class PopularTermAdmin(admin.ModelAdmin):
    """Admin for :class:`~podcasts.models.PopularTerm` instances.

    Displays search term, hit count, and date. Ordered by most popular and
    shows created/updated timestamps as read-only.
    """

    list_display = ("term", "times", "date_search")
    search_fields = ("term",)
    ordering = ("-times",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(TopicSuggestion)
class TopicSuggestionAdmin(admin.ModelAdmin):
    """Admin for :class:`~podcasts.models.TopicSuggestion` instances.

    Displays title, recorded status, and creation date. Filters by recorded
    status and orders by most recent.
    """

    list_display = ("title", "is_recorded", "created_at")
    list_filter = ("is_recorded",)
    search_fields = ("title",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
