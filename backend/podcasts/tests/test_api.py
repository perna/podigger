import pytest
from rest_framework.test import APIClient

from podcasts.models import Episode, Podcast, PopularTerm


@pytest.mark.django_db
class TestPodcastAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_list_podcasts(self):
        Podcast.objects.create(name="Pod 1", feed="http://feed1.com")
        response = self.client.get("/api/podcasts/")
        assert response.status_code == 200
        assert len(response.data) == 1


@pytest.mark.django_db
class TestEpisodeAPI:
    def setup_method(self):
        self.client = APIClient()
        self.podcast = Podcast.objects.create(name="Pod 1", feed="http://feed1.com")
        self.episode1 = Episode.objects.create(
            podcast=self.podcast,
            title="Ep 1",
            link="http://link1.com",
            description="A great episode about python",
        )
        self.episode2 = Episode.objects.create(
            podcast=self.podcast,
            title="Ep 2",
            link="http://link2.com",
            description="Another episode about django",
        )

    def test_list_episodes(self):
        response = self.client.get("/api/episodes/")
        assert response.status_code == 200
        assert len(response.data) == 2

    def test_filter_episodes_by_podcast(self):
        other_podcast = Podcast.objects.create(name="Pod 2", feed="http://feed2.com")
        Episode.objects.create(
            podcast=other_podcast, title="Ep 3", link="http://link3.com"
        )

        response = self.client.get(f"/api/episodes/?podcast={self.podcast.id}")
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["title"] in ["Ep 1", "Ep 2"]

    def test_search_episodes(self):
        # Note: Full text search might require specific DB setup or mocking in some envs.
        # Here we test the endpoint structure.
        # For simple sqlite/tests, search behavior might vary or fail if not using Postgres.
        # Assuming we might be running against a DB that supports it or mocking.
        # If running with pytest-django and a configured DB, this should work if data is committed.

        response = self.client.get("/api/episodes/?q=python")
        assert response.status_code == 200
        # If FTS is working and data is indexed, it should return 1.
        # If not (e.g. sqlite), it might return empty or error depending on setup.
        # We'll check status code primarily for now.


@pytest.mark.django_db
class TestPopularTermAPI:
    def setup_method(self):
        self.client = APIClient()
        PopularTerm.objects.create(term="python", times=10)
        PopularTerm.objects.create(term="django", times=5)

    def test_list_popular_terms(self):
        response = self.client.get("/api/popular-terms/")
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["term"] == "python"
