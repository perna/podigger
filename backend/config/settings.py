import os
from pathlib import Path

# Use django-environ to manage environment variables and .env files. This
# lets developers keep a local `backend/.env` file (ignored by git) while
# CI and production can inject secrets via environment variables.
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Read environment from `backend/.env` (if present) and the process env.
env = environ.Env(
    DJANGO_DEBUG=(bool, True),
)
# If a .env file exists next to BASE_DIR, load it. This is optional and
# won't overwrite real environment variables provided by CI or production.
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(str(env_file))

# SECURITY
SECRET_KEY = env(
    "DJANGO_SECRET_KEY", default=os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key")
)
DEBUG = env.bool("DJANGO_DEBUG", default=os.environ.get("DJANGO_DEBUG", "1") == "1")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["*"])

# Applications
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "rest_framework",
    "django_filters",
    "corsheaders",
    "podcasts",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database
# Support DATABASE_URL (preferred) or fall back to individual DATABASE_* env vars
# so the Docker Compose `DATABASE_HOST=db` configuration is respected.
database_url = os.environ.get("DATABASE_URL") or env("DATABASE_URL", default=None)
if database_url:
    DATABASES = {"default": env.db("DATABASE_URL", default=database_url)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env(
                "DATABASE_NAME", default=os.environ.get("DATABASE_NAME", "podigger")
            ),
            "USER": env(
                "DATABASE_USER", default=os.environ.get("DATABASE_USER", "docker")
            ),
            "PASSWORD": env(
                "DATABASE_PASSWORD",
                default=os.environ.get("DATABASE_PASSWORD", "docker"),
            ),
            "HOST": env(
                "DATABASE_HOST", default=os.environ.get("DATABASE_HOST", "localhost")
            ),
            "PORT": env(
                "DATABASE_PORT", default=os.environ.get("DATABASE_PORT", "5432")
            ),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
]

# Redis Cache Configuration
# Supports both local development (localhost) and Docker (redis service)
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env(
            "REDIS_URL", default=os.environ.get("REDIS_URL", "redis://localhost:6379/1")
        ),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

# Celery Configuration
CELERY_BROKER_URL = env(
    "CELERY_BROKER_URL",
    default=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
)
CELERY_RESULT_BACKEND = env(
    "CELERY_RESULT_BACKEND",
    default=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# DRF Configuration for REST API only (no HTML rendering)
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
}

# CORS
CORS_ALLOW_ALL_ORIGINS = True

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
