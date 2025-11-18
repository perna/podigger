from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from podcasts import views as podcast_views

router = routers.DefaultRouter()
router.register(r'podcasts', podcast_views.PodcastViewSet)
router.register(r'episodes', podcast_views.EpisodeViewSet)
router.register(r'topic-suggestions', podcast_views.TopicSuggestionViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
