import pytest
from rest_framework.test import APIClient
from podcasts.models import Podcast
from podcasts.tasks import add_episode

@pytest.mark.django_db
class TestPodcastViewSetFeatures:
    def setup_method(self):
        self.client = APIClient()

    def test_create_podcast(self, mocker):
        mock_task = mocker.patch('podcasts.views.add_episode.delay')
        data = {'name': 'New Pod', 'feed': 'http://newfeed.com'}
        response = self.client.post('/api/podcasts/', data)
        
        assert response.status_code == 201
        assert Podcast.objects.count() == 1
        mock_task.assert_called_once_with('http://newfeed.com')

    def test_create_duplicate_podcast(self):
        Podcast.objects.create(name="Existing", feed="http://exist.com")
        data = {'name': 'Existing', 'feed': 'http://exist.com'}
        response = self.client.post('/api/podcasts/', data)
        
        assert response.status_code == 200
        assert response.data['status'] == 'none'

    def test_recent_podcasts(self):
        for i in range(10):
            Podcast.objects.create(name=f"Pod {i}", feed=f"http://feed{i}.com")
            
        response = self.client.get('/api/podcasts/recent/')
        assert response.status_code == 200
        assert len(response.data) == 6
        # Should be the last 6 created (ids 10 down to 5)
        assert response.data[0]['name'] == 'Pod 9'

    def test_search_podcast(self):
        Podcast.objects.create(name="Python Podcast", feed="http://py.com")
        Podcast.objects.create(name="Java Podcast", feed="http://java.com")
        
        response = self.client.get('/api/podcasts/?search=Python')
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Python Podcast'
