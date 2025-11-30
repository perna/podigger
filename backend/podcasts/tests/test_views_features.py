import pytest
from rest_framework.test import APIClient

from podcasts.models import Episode, Podcast, PopularTerm


@pytest.mark.django_db
class TestPodcastViewSetFeatures:
    def setup_method(self):
        """Set up a Django REST Framework APIClient instance for test methods.

        Assigns an APIClient to self.client for making HTTP requests in each test.
        """
        self.client = APIClient()

    def test_create_podcast(self, mocker):
        mocker.patch("podcasts.views.is_valid_feed", return_value=True)
        mock_task = mocker.patch("podcasts.views.add_episode.delay")
        data = {"name": "New Pod", "feed": "http://newfeed.com"}
        response = self.client.post("/api/podcasts/", data)

        assert response.status_code == 201
        assert Podcast.objects.count() == 1
        mock_task.assert_called_once_with("http://newfeed.com")

    def test_create_duplicate_podcast(self, mocker):
        mocker.patch("podcasts.views.is_valid_feed", return_value=True)
        Podcast.objects.create(name="Existing", feed="http://exist.com")
        data = {"name": "Existing", "feed": "http://exist.com"}
        response = self.client.post("/api/podcasts/", data)

        assert response.status_code == 200
        assert response.data["status"] == "none"

    def test_recent_podcasts(self):
        for i in range(10):
            Podcast.objects.create(name=f"Pod {i}", feed=f"http://feed{i}.com")

        response = self.client.get("/api/podcasts/recent/")
        assert response.status_code == 200
        assert len(response.data) == 6
        # Should be the last 6 created (ids 10 down to 5)
        assert response.data[0]["name"] == "Pod 9"

    def test_search_podcast(self):
        Podcast.objects.create(name="Python Podcast", feed="http://py.com")
        Podcast.objects.create(name="Java Podcast", feed="http://java.com")

        response = self.client.get("/api/podcasts/?search=Python")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Python Podcast"

    def test_search_episodes_saves_term(self):
        # Create some episodes to search
        p = Podcast.objects.create(name="Pod", feed="http://feed.com")
        Episode.objects.create(
            podcast=p, title="Python Rocks", link="http://1.com", published="2023-01-01"
        )

        # Search
        response = self.client.get("/api/episodes/?q=Python")

        assert response.status_code == 200
        # Check if PopularTerm was saved
        assert PopularTerm.objects.filter(term="Python").exists()
        term = PopularTerm.objects.get(term="Python")
        assert term.times == 1

    def test_create_podcast_validates_feed(self, mocker):
        # Mock is_valid_feed to return False
        mocker.patch("podcasts.views.is_valid_feed", return_value=False)

        data = {"name": "Bad Feed", "feed": "http://bad.com"}
        response = self.client.post("/api/podcasts/", data)

        assert response.status_code == 400
        assert "feed" in str(response.data) or "message" in str(response.data)
        assert Podcast.objects.count() == 0
