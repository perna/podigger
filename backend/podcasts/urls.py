from django.urls import include, path

from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r"podcasts", views.PodcastViewSet)
router.register(r"episodes", views.EpisodeViewSet)
router.register(r"topic-suggestions", views.TopicSuggestionViewSet)
router.register(r"popular-terms", views.PopularTermViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
