from typing import ClassVar

from rest_framework import serializers

from .models import Episode, Podcast, PopularTerm, Tag


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


class PodcastLanguageSerializer(serializers.ModelSerializer):
    """Serializer for PodcastLanguage model (T007)."""

    class Meta:
        """Meta options for PodcastLanguageSerializer."""

        model = PodcastLanguage
        fields: ClassVar = ["id", "code", "name"]


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
    """Serializer for listing Podcasts (T008)."""

    language = PodcastLanguageSerializer(read_only=True)

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
    """Serializer for Podcast details (T009)."""

    language = PodcastLanguageSerializer(read_only=True)
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


class PodcastUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating Podcasts with feed uniqueness validation."""

    class Meta:
        """Meta options for PodcastUpdateSerializer."""

        model = Podcast
        fields: ClassVar = [
            "id",
            "name",
            "feed",
            "image",
            "language",
            "total_episodes",
        ]
        read_only_fields: ClassVar = ["id", "total_episodes"]

    def validate_feed(self, value):
        """Validate feed URL uniqueness excluding current instance.

        Parameters:
            value (str): The feed URL to validate.

        Returns:
            str: The validated feed URL.

        Raises:
            serializers.ValidationError: If feed URL is already used by another podcast.
        """
        msg = "Um podcast com este feed já existe."
        if (
            self.instance
            and value != self.instance.feed
            and Podcast.objects.filter(feed=value).exclude(pk=self.instance.pk).exists()
        ):
            raise serializers.ValidationError(msg)
        return value


class PopularTermSerializer(serializers.ModelSerializer):
    """Serializer for PopularTerm model."""

    class Meta:
        """Meta options for PopularTermSerializer."""

        model = PopularTerm
        fields: ClassVar = ["term", "times"]
