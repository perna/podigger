from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'podcasts', views.PodcastViewSet)
router.register(r'episodes', views.EpisodeViewSet)
router.register(r'topic-suggestions', views.TopicSuggestionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
