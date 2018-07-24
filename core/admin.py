from django.contrib import admin
from .models import Podcast, Episode

class PodcastAdmin(admin.ModelAdmin):
    pass

class EpisodeAdmin(admin.ModelAdmin):
    list_display = ('title', 'podcast', 'published_at')
    list_filter = ('podcast', 'published_at')

admin.site.register(Podcast, PodcastAdmin)
admin.site.register(Episode, EpisodeAdmin)
