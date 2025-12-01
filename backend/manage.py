#!/usr/bin/env python
import os
import sys


def main():
    """Set the default Django settings module (if unset) and invoke Django's command-line utility with the current process arguments.

    This function ensures DJANGO_SETTINGS_MODULE is set to "config.settings" when not already defined and then calls Django's management entry point to handle the process's command-line arguments.

    Raises:
        ImportError: If Django cannot be imported.
    """
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH environment variable?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
