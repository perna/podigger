from podcasts.services.feed_parser import is_valid_feed, parse_feed


def test_parse_feed_valid_url(mocker):
    # Mock feedparser.parse
    mock_parse = mocker.patch("backend.podcasts.services.feed_parser.feedparser.parse")
    mock_parse.return_value.feed = {
        "title": "Test Podcast",
        "language": "en",
        "image": {"href": "http://example.com/image.png"},
    }
    mock_parse.return_value.entries = [
        {
            "title": "Episode 1",
            "link": "http://example.com/ep1",
            "published": "2023-01-01",
            "description": "Description 1",
            "enclosures": [{"href": "http://example.com/audio1.mp3"}],
        }
    ]

    result = parse_feed("http://example.com/feed")

    assert result["title"] == "Test Podcast"
    assert result["language"] == "en"
    assert result["image"] == "http://example.com/image.png"
    assert len(result["items"]) == 1
    assert result["items"][0]["title"] == "Episode 1"
    assert result["items"][0]["enclosure"] == "http://example.com/audio1.mp3"


def test_parse_feed_invalid_url(mocker):
    mock_parse = mocker.patch("backend.podcasts.services.feed_parser.feedparser.parse")
    mock_parse.side_effect = Exception("Network error")

    result = parse_feed("http://invalid-url.com")
    assert result == {}


def test_is_valid_feed_true(mocker):
    mock_parse = mocker.patch("backend.podcasts.services.feed_parser.feedparser.parse")
    mock_parse.return_value.bozo = 0
    assert is_valid_feed("http://valid.com") is True


def test_is_valid_feed_false(mocker):
    mock_parse = mocker.patch("backend.podcasts.services.feed_parser.feedparser.parse")
    mock_parse.return_value.bozo = 1
    assert is_valid_feed("http://invalid.com") is False
