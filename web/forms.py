from django.forms import ModelForm
from core.models import Podcast

class PodcastForm(ModelForm):
    class Meta:
        model = Podcast
        fields = ['name', 'feed']