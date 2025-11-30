from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from podcasts.models import Episode, Podcast, PopularTerm, Tag, TopicSuggestion


class Command(BaseCommand):
    help = (
        "Remove seeded fake data created within the last N minutes. "
        "This will delete podcasts and episodes created recently and remove orphan tags created in that window."
    )

    def add_arguments(self, parser):
        """Register command-line options for the management command.

        Adds:
        - `--minutes`: integer lookback window in minutes used to select data created since (default 60).
        - `--dry-run`: flag that, when set, prints what would be deleted without performing deletions.
        """
        parser.add_argument(
            "--minutes",
            type=int,
            default=60,
            help="Lookback window in minutes to identify seeded data",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without deleting",
        )

    def handle(self, *args, **options):
        """
        Remove podcast-related seed data created within the last `minutes` minutes.
        
        Identifies Podcast, Episode, Tag, PopularTerm, and TopicSuggestion records with created_at >= (now - minutes).
        If `dry_run` is True, prints counts and exits without deleting. Otherwise deletes episodes, then podcasts,
        removes tags created in the window that have no related episode, and deletes matching popular terms and topic suggestions,
        then prints a deletion summary.
        
        Parameters:
            options (dict): Command options; recognized keys:
                minutes (int): Lookback window in minutes used to select recently created records.
                dry_run (bool): If True, report what would be deleted and do not perform deletions.
        """
        _ = args
        self.stdout.write("Cleaning up fake data...")
        minutes = options.get("minutes")
        dry_run = options.get("dry_run")

        cutoff = timezone.now() - timedelta(minutes=minutes)

        podcasts_qs = Podcast.objects.filter(created_at__gte=cutoff)
        episodes_qs = Episode.objects.filter(created_at__gte=cutoff)
        pterms_qs = PopularTerm.objects.filter(created_at__gte=cutoff)
        topics_qs = TopicSuggestion.objects.filter(created_at__gte=cutoff)
        tags_qs = Tag.objects.filter(created_at__gte=cutoff)

        self.stdout.write(
            f"Identified {podcasts_qs.count()} podcasts, {episodes_qs.count()} episodes, {tags_qs.count()} tags, {pterms_qs.count()} popular terms, {topics_qs.count()} topic suggestions created since {cutoff}."
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING("Dry run mode - no records will be deleted.")
            )
            return

        # Delete episodes first
        ep_count = episodes_qs.count()
        podcasts_count = podcasts_qs.count()
        _ = tags_qs.count()
        pterms_count = pterms_qs.count()
        topics_count = topics_qs.count()

        episodes_qs.delete()
        podcasts_qs.delete()

        # Remove tags that are now orphaned and were created in the window
        orphan_tags = tags_qs.filter(episode__isnull=True)
        orphan_tags_count = orphan_tags.count()
        orphan_tags.delete()

        pterms_qs.delete()
        topics_qs.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {ep_count} episodes, {podcasts_count} podcasts, {orphan_tags_count} orphan tags, {pterms_count} popular terms, {topics_count} topic suggestions."
            )
        )