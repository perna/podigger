#!/usr/bin/env python
import os
import sys


def main():
    """Set default settings and invoke Django's command-line utility.

    Ensures DJANGO_SETTINGS_MODULE is set to "config.settings" if undefined, then
    calls Django's management entry point.

    Raises:
        ImportError: If Django cannot be imported.
    """
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        msg = (
            "Couldn't import Django. Are you sure it's installed and available on "
            "your PYTHONPATH environment variable?"
        )
        raise ImportError(msg) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
