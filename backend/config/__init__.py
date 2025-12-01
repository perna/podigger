# config package for Django project
from .__version__ import __version__
from .celery import app as celery_app

__all__ = ("__version__", "celery_app")
