FROM python:3.12-slim

# System deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY requirements.txt /app/requirements.txt
# Install Python dependencies with pip
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy project (will be overridden by bind-mount in development)
COPY . /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Default command runs uvicorn via manage.py ASGI (adjust in production)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
