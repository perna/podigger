import datetime

from django.utils import timezone

import pytest
from accounts.models import User
from rest_framework.test import APIClient

from podcasts.models import Episode, Podcast, PopularTerm, Tag


@pytest.mark.django_db
class TestPodcastViewSetFeatures:
    def setup_method(self):
        """Set up a Django REST Framework APIClient instance for test methods.

        Assigns an APIClient to self.client for making HTTP requests in each test.
        Uses the custom accounts.User model (email-based) instead of the default
        Django auth.User.
        """
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="password123",
            approval_status="approved",
            role="editor",
        )
        self.client.force_authenticate(user=self.user)

    def test_create_podcast(self, mocker):
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_feed", return_value=True
        )
        mock_task = mocker.patch("podcasts.services.podcast_service.add_episode.delay")
        data = {"name": "New Pod", "feed": "http://newfeed.com"}
        response = self.client.post("/api/podcasts/", data)

        assert response.status_code == 201
        assert Podcast.objects.count() == 1
        mock_task.assert_called_once_with("http://newfeed.com")

    def test_create_duplicate_podcast(self, mocker):
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_feed", return_value=True
        )
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
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Python Podcast"

    def test_search_episodes_enqueues_popular_term_task(self, mocker):
        """The search endpoint MUST enqueue `record_search_term` instead of
        writing `PopularTerm` directly (US1, Q4). The counter is eventually
        consistent.
        """
        # Create some episodes to search
        p = Podcast.objects.create(name="Pod", feed="http://feed.com")
        Episode.objects.create(
            podcast=p,
            title="Python Rocks",
            link="http://1.com",
            published=timezone.make_aware(
                datetime.datetime(2023, 1, 1),  # noqa: DTZ001
                datetime.UTC,
            ),
        )
        # Mock the Celery enqueue so no worker is required.
        mock_delay = mocker.patch("podcasts.views.record_search_term.delay")

        # Search
        response = self.client.get("/api/episodes/?q=Python")

        assert response.status_code == 200
        # The Celery task was enqueued with the searched term.
        mock_delay.assert_called_once_with("Python")
        # And no PopularTerm row was written synchronously.
        assert not PopularTerm.objects.filter(term="Python").exists()

    def test_create_podcast_validates_feed(self, mocker):
        # Mock is_valid_feed to return False
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_feed", return_value=False
        )

        data = {"name": "Bad Feed", "feed": "http://bad.com"}
        response = self.client.post("/api/podcasts/", data)

        assert response.status_code == 400
        assert "feed" in str(response.data) or "message" in str(response.data)
        assert Podcast.objects.count() == 0


@pytest.mark.django_db
class TestPodcastDetailStatementBudget:
    """US3: GET /api/podcasts/{id}/ MUST issue at most 4 statements (SC-003)."""

    def setup_method(self):
        self.client = APIClient()
        self.podcast = Podcast.objects.create(name="P", feed="http://f.com")
        for i in range(30):
            ep = Episode.objects.create(
                podcast=self.podcast, title=f"E{i}", link=f"http://f.com/{i}"
            )
            for j in range(5):
                tag, _ = Tag.objects.get_or_create(name=f"t-{j}")
                ep.tags.add(tag)

    def test_podcast_detail_statement_count(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(f"/api/podcasts/{self.podcast.id}/")
        assert response.status_code == 200
        assert len(response.data["episodes"]) == 30
        assert (
            len(ctx.captured_queries) <= 4
        ), f"detail emitted {len(ctx.captured_queries)} statements, budget is 4"


@pytest.mark.django_db
class TestEpisodesListOrdering:
    """US3: the default ordering of the episode list is `-published`."""

    def test_episodes_list_default_ordering(self):
        client = APIClient()
        p = Podcast.objects.create(name="P", feed="http://f.com")
        base = timezone.now()
        for i in range(3):
            Episode.objects.create(
                podcast=p,
                title=f"E{i}",
                link=f"http://f.com/{i}",
                published=base - datetime.timedelta(days=i),
            )
        response = client.get("/api/episodes/")
        assert response.status_code == 200
        titles = [r["title"] for r in response.data["results"]]
        assert titles == ["E0", "E1", "E2"]  # most recent first
