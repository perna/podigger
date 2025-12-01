import json
from pathlib import Path

from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Remove records present in a fixture JSON file (careful: deletes by PK)."

    def add_arguments(self, parser):
        """
        Register command-line arguments used by this management command.

        Adds a positional optional `fixture` argument (path to the JSON fixture; defaults to
        backend/podcasts/fixtures/initial_fake_seed.json) and a `--dry-run` flag to simulate deletions.

        Parameters:
            parser (argparse.ArgumentParser): The parser to register the arguments on.
        """
        parser.add_argument(
            "fixture",
            nargs="?",
            default="backend/podcasts/fixtures/initial_fake_seed.json",
            help="Path to the fixture JSON file to remove records from",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without deleting",
        )

    def handle(self, *args, **options):
        """Remove database records listed in a JSON fixture file.

        Loads the fixture specified by options["fixture"], aggregates primary keys per model, determines a deletion order that minimizes foreign-key conflicts, and deletes the corresponding records inside a single database transaction. Reports the number of records found per model and supports a dry-run mode (options["dry_run"]) that reports what would be removed without performing any deletions. Unknown models present in the fixture are skipped with a warning; a missing fixture file causes the command to exit without changes.

        Parameters:
            *args: Positional arguments passed by Django (unused).
            options (dict): Command options; expected keys:
                - "fixture" (str or Path): Path to the JSON fixture file containing objects with "model" and "pk".
                - "dry_run" (bool): If true, do not perform deletions and only report actions.
        """
        _ = args
        fixture_path = Path(options["fixture"])
        dry_run = options["dry_run"]

        if not fixture_path.exists():
            self.stderr.write(
                self.style.ERROR(f"Fixture file not found: {fixture_path}")
            )
            return

        with fixture_path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)

        # Collect pks per model
        models_pks = {}
        for obj in data:
            model_label = obj.get("model")  # e.g. 'podcasts.podcast'
            pk = obj.get("pk")
            if not model_label or pk is None:
                continue
            models_pks.setdefault(model_label, set()).add(pk)

        # Order deletion to reduce FK problems: episodes -> podcasts -> tags -> others
        preferred_order = [
            "podcasts.episode",
            "podcasts.podcast",
            "podcasts.tag",
            "podcasts.popularterm",
            "podcasts.topicsuggestion",
            "podcasts.podcastlanguage",
        ]

        # Append any other models present but not in preferred order
        for m in list(models_pks.keys()):
            if m not in preferred_order:
                preferred_order.append(m)

        to_delete = []
        for model_label in preferred_order:
            pks = models_pks.get(model_label)
            if not pks:
                continue
            try:
                app_label, model_name = model_label.split(".")
                model = apps.get_model(app_label, model_name)
            except Exception:
                self.stderr.write(
                    self.style.WARNING(
                        f"Unknown model in fixture: {model_label}, skipping."
                    )
                )
                continue
            qs = model.objects.filter(pk__in=list(pks))
            count = qs.count()
            to_delete.append((model_label, count, qs))

        # Report
        total = sum(c for _, c, _ in to_delete)
        self.stdout.write(
            f"Found {total} records across {len(to_delete)} models to delete."
        )
        for model_label, count, _ in to_delete:
            self.stdout.write(f"  - {model_label}: {count}")

        if dry_run:
            self.stdout.write(
                self.style.WARNING("Dry-run enabled; no records were deleted.")
            )
            return

        # Perform deletion inside transaction
        with transaction.atomic():
            for model_label, count, qs in to_delete:
                if count:
                    qs.delete()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Deleted {count} records from {model_label}"
                        )
                    )

        self.stdout.write(self.style.SUCCESS("Fixture-based deletion completed."))
