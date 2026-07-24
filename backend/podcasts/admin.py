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
    list_display = ("code", "name")
    search_fields = ("name",)


@admin.register(Podcast)
class PodcastAdmin(admin.ModelAdmin):
    list_display = ("name", "language", "total_episodes", "created_at")
    list_filter = ("language",)
    search_fields = ("name",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ("title", "podcast", "published")
    list_filter = ("podcast", "published")
    search_fields = ("title", "description")
    ordering = ("-published",)
    raw_id_fields = ("podcast",)
    filter_horizontal = ("tags",)


@admin.register(PopularTerm)
class PopularTermAdmin(admin.ModelAdmin):
    list_display = ("term", "times", "date_search")
    search_fields = ("term",)
    ordering = ("-times",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(TopicSuggestion)
class TopicSuggestionAdmin(admin.ModelAdmin):
    list_display = ("title", "is_recorded", "created_at")
    list_filter = ("is_recorded",)
    search_fields = ("title",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
