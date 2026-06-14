"""Comprehensive CRUD tests for Podcast API."""
import pytest
from rest_framework.test import APIClient

from accounts.models import User
from podcasts.models import Episode, Podcast, PodcastLanguage


@pytest.mark.django_db
class TestPodcastListAPI:
    """Tests for podcast list endpoint with pagination and filters."""

    def setup_method(self):
        """Set up test client and sample data."""
        self.client = APIClient()
        self.language_pt = PodcastLanguage.objects.create(code="pt", name="português")
        self.language_en = PodcastLanguage.objects.create(code="en", name="english")

        self.podcast1 = Podcast.objects.create(
            name="Python Podcast",
            feed="https://python.com/rss",
            language=self.language_pt,
        )
        self.podcast2 = Podcast.objects.create(
            name="Django Podcast",
            feed="https://django.com/rss",
            language=self.language_en,
        )

    def test_list_podcasts_with_pagination(self):
        """Verify list endpoint returns paginated results with metadata."""
        response = self.client.get("/api/podcasts/")

        assert response.status_code == 200
        assert "count" in response.data
        assert "next" in response.data
        assert "previous" in response.data
        assert "results" in response.data
        assert response.data["count"] == 2
        assert len(response.data["results"]) == 2

    def test_list_podcasts_with_search_filter(self):
        """Verify search parameter filters podcasts by name."""
        response = self.client.get("/api/podcasts/?search=Python")

        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == "Python Podcast"

    def test_list_podcasts_with_language_filter(self):
        """Verify language parameter filters podcasts by language ID."""
        response = self.client.get(f"/api/podcasts/?language={self.language_pt.id}")

        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == "Python Podcast"

    def test_list_podcasts_anonymous_access(self):
        """Verify anonymous users can access list endpoint (public)."""
        response = self.client.get("/api/podcasts/")

        assert response.status_code == 200


@pytest.mark.django_db
class TestPodcastRetrieveAPI:
    """Tests for podcast retrieve endpoint."""

    def setup_method(self):
        """Set up test client and sample podcast with episodes."""
        self.client = APIClient()
        self.podcast = Podcast.objects.create(
            name="Test Podcast",
            feed="https://test.com/rss",
            image="https://test.com/cover.jpg",
            total_episodes=2,
        )
        self.episode1 = Episode.objects.create(
            podcast=self.podcast,
            title="Episode 1",
            link="https://test.com/ep1",
            description="First episode",
        )
        self.episode2 = Episode.objects.create(
            podcast=self.podcast,
            title="Episode 2",
            link="https://test.com/ep2",
            description="Second episode",
        )

    def test_retrieve_podcast_detail(self):
        """Verify retrieve endpoint returns full podcast data with episodes."""
        response = self.client.get(f"/api/podcasts/{self.podcast.id}/")

        assert response.status_code == 200
        assert response.data["id"] == self.podcast.id
        assert response.data["name"] == "Test Podcast"
        assert response.data["feed"] == "https://test.com/rss"
        assert response.data["image"] == "https://test.com/cover.jpg"
        assert response.data["total_episodes"] == 2
        assert "episodes" in response.data
        assert len(response.data["episodes"]) == 2

    def test_retrieve_nonexistent_podcast(self):
        """Verify retrieve endpoint returns 404 for non-existent podcast."""
        response = self.client.get("/api/podcasts/99999/")

        assert response.status_code == 404

    def test_retrieve_podcast_anonymous_access(self):
        """Verify anonymous users can access retrieve endpoint (public)."""
        response = self.client.get(f"/api/podcasts/{self.podcast.id}/")

        assert response.status_code == 200


@pytest.mark.django_db
class TestPodcastCreateAPI:
    """Tests for podcast create endpoint."""

    def setup_method(self):
        """Set up test client and users with different roles."""
        self.client = APIClient()
        self.editor_user = User.objects.create_user(
            email="editor@example.com",
            password="password123",
            role="editor",
            approval_status="approved",
        )
        self.reader_user = User.objects.create_user(
            email="reader@example.com",
            password="password123",
            role="reader",
            approval_status="approved",
        )

    def test_create_podcast_success(self, mocker):
        """Verify create endpoint returns 201 with valid data."""
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_url_format",
            return_value=True,
        )
        mock_task = mocker.patch("podcasts.services.podcast_service.add_episode.delay")

        self.client.force_authenticate(user=self.editor_user)
        response = self.client.post(
            "/api/podcasts/",
            {"name": "New Podcast", "feed": "https://new.com/rss"},
        )

        assert response.status_code == 201
        assert response.data["status"] == "created"
        assert "id" in response.data
        mock_task.assert_called_once_with("https://new.com/rss")

    def test_create_podcast_duplicate_feed(self, mocker):
        """Verify create endpoint returns 200 for duplicate feed."""
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_url_format",
            return_value=True,
        )
        Podcast.objects.create(name="Existing", feed="https://existing.com/rss")

        self.client.force_authenticate(user=self.editor_user)
        response = self.client.post(
            "/api/podcasts/",
            {"name": "Existing", "feed": "https://existing.com/rss"},
        )

        assert response.status_code == 200
        assert response.data["status"] == "none"

    def test_create_podcast_invalid_url_format(self):
        """Verify create endpoint returns 400 for malformed URL."""
        self.client.force_authenticate(user=self.editor_user)
        response = self.client.post(
            "/api/podcasts/",
            {"name": "Bad Podcast", "feed": "not-a-url"},
        )

        assert response.status_code == 400
        assert "feed" in str(response.data).lower() or "url" in str(response.data).lower()

    def test_create_podcast_empty_name(self, mocker):
        """Verify create endpoint returns 400 for empty name."""
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_url_format",
            return_value=True,
        )

        self.client.force_authenticate(user=self.editor_user)
        response = self.client.post(
            "/api/podcasts/",
            {"name": "", "feed": "https://test.com/rss"},
        )

        assert response.status_code == 400

    def test_create_podcast_enqueues_task(self, mocker):
        """Verify create endpoint enqueues add_episode task on success."""
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_url_format",
            return_value=True,
        )
        mock_task = mocker.patch("podcasts.services.podcast_service.add_episode.delay")

        self.client.force_authenticate(user=self.editor_user)
        self.client.post(
            "/api/podcasts/",
            {"name": "Task Podcast", "feed": "https://task.com/rss"},
        )

        mock_task.assert_called_once_with("https://task.com/rss")

    def test_create_podcast_anonymous_forbidden(self):
        """Verify anonymous users cannot create podcasts."""
        response = self.client.post(
            "/api/podcasts/",
            {"name": "Anonymous Podcast", "feed": "https://anon.com/rss"},
        )

        assert response.status_code in (401, 403)

    def test_create_podcast_reader_forbidden(self, mocker):
        """Verify reader-role users cannot create podcasts."""
        mocker.patch(
            "podcasts.services.podcast_service.is_valid_url_format",
            return_value=True,
        )

        self.client.force_authenticate(user=self.reader_user)
        response = self.client.post(
            "/api/podcasts/",
            {"name": "Reader Podcast", "feed": "https://reader.com/rss"},
        )

        assert response.status_code == 403


@pytest.mark.django_db
class TestPodcastUpdateAPI:
    """Tests for podcast update endpoint."""

    def setup_method(self):
        """Set up test client, users, and sample podcast."""
        self.client = APIClient()
        self.editor_user = User.objects.create_user(
            email="editor@example.com",
            password="password123",
            role="editor",
            approval_status="approved",
        )
        self.reader_user = User.objects.create_user(
            email="reader@example.com",
            password="password123",
            role="reader",
            approval_status="approved",
        )
        self.podcast = Podcast.objects.create(
            name="Original Name",
            feed="https://original.com/rss",
            image="https://original.com/cover.jpg",
        )

    def test_update_podcast_full(self):
        """Verify full update (PUT) returns 200 with updated data."""
        self.client.force_authenticate(user=self.editor_user)
        response = self.client.put(
            f"/api/podcasts/{self.podcast.id}/",
            {
                "name": "Updated Name",
                "feed": "https://original.com/rss",
                "image": "https://updated.com/cover.jpg",
            },
        )

        assert response.status_code == 200
        assert response.data["name"] == "Updated Name"
        assert response.data["image"] == "https://updated.com/cover.jpg"

    def test_update_podcast_partial_name(self):
        """Verify partial update (PATCH) changes only specified fields."""
        self.client.force_authenticate(user=self.editor_user)
        response = self.client.patch(
            f"/api/podcasts/{self.podcast.id}/",
            {"name": "Partial Update"},
        )

        assert response.status_code == 200
        assert response.data["name"] == "Partial Update"
        assert response.data["feed"] == "https://original.com/rss"
        assert response.data["image"] == "https://original.com/cover.jpg"

    def test_update_podcast_partial_image(self):
        """Verify partial update (PATCH) can change image field."""
        self.client.force_authenticate(user=self.editor_user)
        response = self.client.patch(
            f"/api/podcasts/{self.podcast.id}/",
            {"image": "https://newimage.com/cover.jpg"},
        )

        assert response.status_code == 200
        assert response.data["image"] == "https://newimage.com/cover.jpg"

    def test_update_nonexistent_podcast(self):
        """Verify update endpoint returns 404 for non-existent podcast."""
        self.client.force_authenticate(user=self.editor_user)
        response = self.client.patch(
            "/api/podcasts/99999/",
            {"name": "Nonexistent"},
        )

        assert response.status_code == 404

    def test_update_podcast_duplicate_feed(self):
        """Verify update endpoint returns 400 for feed already used by another podcast."""
        Podcast.objects.create(
            name="Other Podcast",
            feed="https://other.com/rss",
        )

        self.client.force_authenticate(user=self.editor_user)
        response = self.client.patch(
            f"/api/podcasts/{self.podcast.id}/",
            {"feed": "https://other.com/rss"},
        )

        assert response.status_code == 400
        assert "feed" in response.data

    def test_update_podcast_feed_change_triggers_reimport(self, mocker):
        """Verify feed change deletes episodes and enqueues reimport task."""
        mock_reimport = mocker.patch(
            "podcasts.services.podcast_service.reimport_feed.delay"
        )
        Episode.objects.create(
            podcast=self.podcast,
            title="Old Episode",
            link="https://original.com/ep1",
        )

        self.client.force_authenticate(user=self.editor_user)
        response = self.client.patch(
            f"/api/podcasts/{self.podcast.id}/",
            {"feed": "https://newfeed.com/rss"},
        )

        assert response.status_code == 200
        assert self.podcast.episodes.count() == 0
        mock_reimport.assert_called_once_with(self.podcast.id)

    def test_update_podcast_no_feed_change_no_reimport(self, mocker):
        """Verify update without feed change does not trigger reimport."""
        mock_reimport = mocker.patch(
            "podcasts.services.podcast_service.reimport_feed.delay"
        )
        Episode.objects.create(
            podcast=self.podcast,
            title="Episode",
            link="https://original.com/ep1",
        )

        self.client.force_authenticate(user=self.editor_user)
        self.client.patch(
            f"/api/podcasts/{self.podcast.id}/",
            {"name": "New Name"},
        )

        mock_reimport.assert_not_called()
        assert self.podcast.episodes.count() == 1

    def test_update_podcast_anonymous_forbidden(self):
        """Verify anonymous users cannot update podcasts."""
        response = self.client.patch(
            f"/api/podcasts/{self.podcast.id}/",
            {"name": "Anonymous Update"},
        )

        assert response.status_code in (401, 403)

    def test_update_podcast_reader_forbidden(self):
        """Verify reader-role users cannot update podcasts."""
        self.client.force_authenticate(user=self.reader_user)
        response = self.client.patch(
            f"/api/podcasts/{self.podcast.id}/",
            {"name": "Reader Update"},
        )

        assert response.status_code == 403


@pytest.mark.django_db
class TestPodcastDeleteAPI:
    """Tests for podcast delete endpoint."""

    def setup_method(self):
        """Set up test client and users with different roles."""
        self.client = APIClient()
        self.editor_user = User.objects.create_user(
            email="editor@example.com",
            password="password123",
            role="editor",
            approval_status="approved",
        )
        self.reader_user = User.objects.create_user(
            email="reader@example.com",
            password="password123",
            role="reader",
            approval_status="approved",
        )

    def test_delete_podcast_success(self):
        """Verify delete endpoint returns 204 and removes podcast and episodes."""
        podcast = Podcast.objects.create(name="Delete Me", feed="https://delete.com/rss")
        Episode.objects.create(
            podcast=podcast,
            title="Episode to Delete",
            link="https://delete.com/ep1",
        )

        self.client.force_authenticate(user=self.editor_user)
        response = self.client.delete(f"/api/podcasts/{podcast.id}/")

        assert response.status_code == 204
        assert not Podcast.objects.filter(id=podcast.id).exists()
        assert Episode.objects.filter(podcast_id=podcast.id).count() == 0

    def test_delete_nonexistent_podcast(self):
        """Verify delete endpoint returns 404 for non-existent podcast."""
        self.client.force_authenticate(user=self.editor_user)
        response = self.client.delete("/api/podcasts/99999/")

        assert response.status_code == 404

    def test_delete_podcast_anonymous_forbidden(self):
        """Verify anonymous users cannot delete podcasts."""
        podcast = Podcast.objects.create(name="Protected", feed="https://protected.com/rss")
        response = self.client.delete(f"/api/podcasts/{podcast.id}/")

        assert response.status_code in (401, 403)

    def test_delete_podcast_reader_forbidden(self):
        """Verify reader-role users cannot delete podcasts."""
        podcast = Podcast.objects.create(name="Reader Protected", feed="https://reader-protected.com/rss")
        self.client.force_authenticate(user=self.reader_user)
        response = self.client.delete(f"/api/podcasts/{podcast.id}/")

        assert response.status_code == 403
