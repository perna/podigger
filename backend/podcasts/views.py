from rest_framework import viewsets
from .models import Podcast, Episode, TopicSuggestion
from .serializers import PodcastSerializer, EpisodeSerializer, TopicSuggestionSerializer


class PodcastViewSet(viewsets.ModelViewSet):
    queryset = Podcast.objects.all().order_by('-id')
    serializer_class = PodcastSerializer


class EpisodeViewSet(viewsets.ModelViewSet):
    queryset = Episode.objects.all().order_by('-published')
    serializer_class = EpisodeSerializer


class TopicSuggestionViewSet(viewsets.ModelViewSet):
    queryset = TopicSuggestion.objects.all().order_by('-id')
    serializer_class = TopicSuggestionSerializer
