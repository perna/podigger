from django.apps import AppConfig


class PodcastsConfig(AppConfig):
    """Configuration for the podcasts application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "podcasts"

    def ready(self):
        import podcasts.signals  # noqa: F401
