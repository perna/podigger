# Tech Stack

**Analyzed:** 2026-02-12

## Core

- Framework: Django 5.2.11
- Language: Python 3.12
- Runtime: Python 3.12+
- Package manager: pip (requirements.txt + pyproject.toml)

## Frontend

- UI Framework: Next.js 16.1.5 (React 19.2.1)
- Styling: Tailwind CSS v4 + CSS-in-JS (clsx, tailwind-merge)
- State Management: React hooks (built-in)
- Font: Plus Jakarta Sans (Google Fonts)
- Icons: Material Symbols Rounded

## Backend

- API Style: REST (Django REST Framework 3.16.1+)
- Database: PostgreSQL (psycopg2-binary 2.9.11)
- ORM: Django ORM with PostgreSQL extensions (full-text search, trigram similarity)
- Authentication: Django built-in (IsAuthenticatedOrReadOnly)
- Task Queue: Celery 5.5.3
- Message Broker: Redis 7.1.0
- Cache: django-redis 5.4.0

## Testing

- Unit: pytest 7.0.0+
- Integration: pytest-django 4.0.0+
- Mocking: pytest-mock 3.10.0+
- Coverage: Not configured yet

## External Services

- RSS/Atom Feeds: feedparser 6.0.10+
- HTTP Requests: requests 2.31.0+

## Development Tools

- Linter: Ruff 0.8.0+ (replaces flake8, black, isort)
- Server: Gunicorn 20.1.0+ (production), uvicorn 0.38.0 (ASGI)
- Environment: django-environ 0.10.0+
- CORS: django-cors-headers 4.0.0
- Filtering: django-filter 23.2+
- Version Control: Commitizen 3.13.0+ (conventional commits)
- Containerization: Docker + Docker Compose

## Infrastructure

- Database: PostgreSQL (containerized)
- Cache/Queue: Redis (containerized)
- Web Server: Django dev server (development), Gunicorn/Uvicorn (production)
- Worker: Celery worker (containerized)
