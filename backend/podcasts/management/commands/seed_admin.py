import os

from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    """Create a superuser from environment variables if one does not exist."""

    help = (
        "Create a superuser using DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD "
        "environment variables. Does nothing if a superuser already exists."
    )

    def handle(self, *args, **options):
        """Execute the command.

        Reads DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD from the
        environment. Skips creation if either variable is missing or if a
        superuser already exists.
        """
        _ = args, options

        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "anderson.meira@gmail.com")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "123mudar")

        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.SUCCESS(
                    "Superuser already exists. Skipping creation."
                )
            )
            return

        User.objects.create_superuser(email=email, password=password)
        self.stdout.write(
            self.style.SUCCESS(f"Superuser created: {email}")
        )
