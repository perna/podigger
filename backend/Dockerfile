FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# System deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY requirements.txt /app/requirements.txt
RUN uv pip install --system --no-cache -r /app/requirements.txt

# Copy project (will be overridden by bind-mount in development)
COPY . /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Default command runs Django's development server (adjust for production)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
