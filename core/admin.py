from django.contrib import admin
from .models import Podcast, Episode

class PodcastAdmin(admin.ModelAdmin):
    pass

admin.site.register(Podcast, PodcastAdmin)
