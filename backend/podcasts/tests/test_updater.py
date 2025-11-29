import pytest

from podcasts.models import Episode, Podcast
from podcasts.services.updater import EpisodeUpdater


@pytest.mark.django_db
@pytest.mark.xfail(
    reason="total_episodes assertion fails in CI - investigating updater behavior"
)
def test_updater_updates_total_episodes(mocker):
    # Setup
    podcast = Podcast.objects.create(name="Test Pod", feed="http://test.com/feed")

    # Mock parse_feed to return 2 items
    mock_parse = mocker.patch("podcasts.services.updater.parse_feed")
    mock_parse.return_value = {
        "title": "Test Pod",
        "language": "en",
        "image": "http://img.com",
        "items": [
            {
                "title": "Ep 1",
                "link": "http://test.com/1",
                "published": "Fri, 01 Jan 2023 10:00:00 GMT",
                "description": "desc",
                "enclosure": "http://audio.com/1.mp3",
                "tags": []
            },
            {
                "title": "Ep 2",
                "link": "http://test.com/2",
                "published": "Fri, 02 Jan 2023 10:00:00 GMT",
                "description": "desc",
                "enclosure": "http://audio.com/2.mp3",
                "tags": []
            }
        ]
    }

    # Run updater
    updater = EpisodeUpdater(["http://test.com/feed"])
    updater.populate()

    # Refresh podcast
    podcast.refresh_from_db()

    # Assertions
    assert Episode.objects.count() == 2
    assert podcast.total_episodes == 2  # This should fail currently as it defaults to 0 and isn't updated
