from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError

from podcasts.models import (
    PodcastLanguage,
    PopularTerm,
    Tag,
    TopicSuggestion,
    Podcast,
    Episode,
)


class PodcastLanguageModelTests(TestCase):
    def test_defaults_and_field_values(self):
        lang = PodcastLanguage.objects.create()
        self.assertIsNotNone(lang.created_at)
        self.assertEqual(lang.code, "pt")
        self.assertEqual(lang.name, "português")


class PopularTermModelTests(TestCase):
    def test_defaults_and_fields(self):
        pt = PopularTerm.objects.create(term="python")
        self.assertEqual(pt.times, 1)
        # date_search should be a date object roughly equal to today
        self.assertIsNotNone(pt.date_search)
        self.assertEqual(pt.term, "python")


class TagModelTests(TestCase):
    def test_tag_unique_constraint(self):
        Tag.objects.create(name="news")
        with self.assertRaises(IntegrityError):
            # duplicate unique name should fail
            Tag.objects.create(name="news")


class PodcastEpisodeRelationTests(TestCase):
    def setUp(self):
        self.lang = PodcastLanguage.objects.create()
        self.podcast = Podcast.objects.create(name="Test Podcast", feed="https://example.com/feed", language=self.lang)

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
        self.assertEqual(ep.tags.count(), 2)

        # JSON field can be set and retrieved
        ep.to_json = {"foo": "bar"}
        ep.save()
        ep.refresh_from_db()
        self.assertEqual(ep.to_json.get("foo"), "bar")


class TopicSuggestionModelTests(TestCase):
    def test_topic_suggestion_fields(self):
        ts = TopicSuggestion.objects.create(title="New Topic", description="Desc")
        self.assertEqual(ts.title, "New Topic")
        self.assertFalse(ts.is_recorded)
