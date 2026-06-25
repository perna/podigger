# syntax=docker/dockerfile:1

########################################
# Stage 1: Builder - Install dependencies
########################################
FROM python:3.12-slim AS builder

# Copy UV binary for fast dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        gcc \
        curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies FIRST (better layer caching)
COPY requirements.txt requirements-base.txt ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache -r requirements.txt

########################################
# Stage 2: Runtime - Minimal production image
########################################
FROM python:3.12-slim AS runtime

# Install only runtime dependencies (no build tools)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq5 \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 app && \
    mkdir -p /app /app/staticfiles /app/media && \
    chown -R app:app /app

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder --chown=app:app /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder --chown=app:app /usr/local/bin /usr/local/bin

# Copy application code LAST (changes frequently, poor cache hit)
COPY --chown=app:app manage.py pyproject.toml pytest.ini ./
COPY --chown=app:app config ./config
COPY --chown=app:app podcasts ./podcasts
COPY --chown=app:app accounts ./accounts

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings

# Switch to non-root user
USER app

# Collect static files (with dummy secret key for build)
ARG DJANGO_SECRET_KEY=build-only-dummy-key
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Production command using Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
