from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('add_podcast', views.add_podcast, name='add-podcast'),
    path('search', views.search, name='search'),
    path('search/tag', views.search_by_tag, name='search-tag')
]
