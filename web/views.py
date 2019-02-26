from django.shortcuts import render, get_list_or_404
from django.http    import HttpResponseRedirect
from django.contrib import messages
from django.contrib.postgres.search import SearchVector
from django.db.models import Q

from core.models import Episode

from .forms import PodcastForm

def index(request):
    return render(request, 'web/home.html')

def add_podcast(request):
    if request.method == 'POST':
        form = PodcastForm(request.POST)
        
        if form.is_valid():
            form.save()
            messages(request, 'Podcast was added successfully')
            return HttpResponseRedirect('/add_podcast')
        else:
            messages.warning(request, 'Please correct the error below.')
    else:
        form = PodcastForm()
        return render(request, 'web/add_podcast.html', {'form': form})

def search(request):
    term = request.GET['term']
    context = {'term': term}
    return render(request, 'web/results.html', context)
