from typing import ClassVar

from rest_framework import serializers

from .models import Episode, Podcast, PopularTerm, Tag, TopicSuggestion


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""

    class Meta:
        """Meta options for TagSerializer."""

        model = Tag
        fields: ClassVar = ["id", "name"]


class PodcastMinimalSerializer(serializers.ModelSerializer):
    """Minimal podcast data for embedding in episode list/search responses."""

    class Meta:
        """Meta options for PodcastMinimalSerializer."""

        model = Podcast
        fields: ClassVar = ["id", "name", "image"]


class EpisodeSerializer(serializers.ModelSerializer):
    """Serializer for Episode model."""
    tags = TagSerializer(many=True, read_only=True)
    podcast = PodcastMinimalSerializer(read_only=True)

    class Meta:
        """Meta options for EpisodeSerializer."""

        model = Episode
        fields: ClassVar = [
            "id",
            "title",
            "link",
            "description",
            "published",
            "enclosure",
            "podcast",
            "tags",
        ]


class PodcastListSerializer(serializers.ModelSerializer):
    """Serializer for listing Podcasts."""

    class Meta:
        """Meta options for PodcastListSerializer."""

        model = Podcast
        fields: ClassVar = [
            "id",
            "name",
            "feed",
            "image",
            "language",
            "total_episodes",
        ]


class PodcastDetailSerializer(serializers.ModelSerializer):
    """Serializer for Podcast details."""

    episodes = EpisodeSerializer(many=True, read_only=True)

    class Meta:
        """Meta options for PodcastDetailSerializer."""

        model = Podcast
        fields: ClassVar = [
            "id",
            "name",
            "feed",
            "image",
            "language",
            "total_episodes",
            "episodes",
        ]


class TopicSuggestionSerializer(serializers.ModelSerializer):
    """Serializer for TopicSuggestion model."""

    class Meta:
        """Meta options for TopicSuggestionSerializer."""

        model = TopicSuggestion
        fields: ClassVar = ["id", "title", "description", "is_recorded"]


class PopularTermSerializer(serializers.ModelSerializer):
    """Serializer for PopularTerm model."""

    class Meta:
        """Meta options for PopularTermSerializer."""

        model = PopularTerm
        fields: ClassVar = ["term", "times"]
