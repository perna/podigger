from rest_framework import serializers
from .models import Podcast, Episode, Tag, TopicSuggestion


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class EpisodeSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Episode
        fields = ['id', 'title', 'link', 'description', 'published', 'enclosure', 'to_json', 'podcast', 'tags']


class PodcastSerializer(serializers.ModelSerializer):
    episodes = EpisodeSerializer(many=True, read_only=True)

    class Meta:
        model = Podcast
        fields = ['id', 'name', 'feed', 'image', 'language', 'total_episodes', 'episodes']


class TopicSuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicSuggestion
        fields = ['id', 'title', 'description', 'is_recorded']
