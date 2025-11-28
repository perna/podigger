from django.db import IntegrityError
from django.test import TestCase

import pytest

from podcasts.models import (
    Episode,
    Podcast,
    PodcastLanguage,
    PopularTerm,
    Tag,
    TopicSuggestion,
)


class PodcastLanguageModelTests(TestCase):
    def test_defaults_and_field_values(self):
        lang = PodcastLanguage.objects.create()
        assert lang.created_at is not None
        assert lang.code == "pt"
        assert lang.name == "português"


class PopularTermModelTests(TestCase):
    def test_defaults_and_fields(self):
        pt = PopularTerm.objects.create(term="python")
        assert pt.times == 1
        # date_search should be a date object roughly equal to today
        assert pt.date_search is not None
        assert pt.term == "python"


class TagModelTests(TestCase):
    def test_tag_unique_constraint(self):
        Tag.objects.create(name="news")
        with pytest.raises(IntegrityError):
            # duplicate unique name should fail
            Tag.objects.create(name="news")


class PodcastEpisodeRelationTests(TestCase):
    def setUp(self):
        """
        Create a PodcastLanguage and a Podcast instance for tests.

        Sets `self.lang` to a new PodcastLanguage and `self.podcast` to a Podcast named "Test Podcast" with feed "https://example.com/feed" linked to that language.
        """
        self.lang = PodcastLanguage.objects.create()
        self.podcast = Podcast.objects.create(
            name="Test Podcast", feed="https://example.com/feed", language=self.lang
        )

    def test_episode_creation_and_tagging(self):
        tag1 = Tag.objects.create(name="tech")
        tag2 = Tag.objects.create(name="ai")

        ep = Episode.objects.create(
            title="Episode 1",
            link="https://example.com/ep1",
            description="An episode about testing",
            podcast=self.podcast,
        )

        # add tags
        ep.tags.add(tag1, tag2)
        assert ep.tags.count() == 2

        # JSON field can be set and retrieved
        ep.to_json = {"foo": "bar"}
        ep.save()
        ep.refresh_from_db()
        assert ep.to_json.get("foo") == "bar"


class TopicSuggestionModelTests(TestCase):
    def test_topic_suggestion_fields(self):
        ts = TopicSuggestion.objects.create(title="New Topic", description="Desc")
        assert ts.title == "New Topic"
        assert not ts.is_recorded
