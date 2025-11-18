Podigger backend (Django)

This folder contains a minimal Django 5.2.8 project skeleton used while migrating the original Flask app.

How to run (development):

1. Build containers using the repo-level compose file:

```bash
docker compose -f ../docker-compose.django.yml up --build
```

2. The Django dev server will be available at http://localhost:8000 (after `manage.py` and migrations run).

Using uv as package manager

- This project is configured to use `uv` (Astral) as the Python package manager inside the Docker image.
- The Dockerfile installs `uv` and runs `uv pip sync /app/requirements.txt` to install locked dependencies.
- If you want to work locally without Docker, install `uv` using the installer:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then you can create a venv and sync dependencies:

```bash
uv venv
uv pip sync requirements.txt
```


Notes:
- Database credentials are read from environment variables in `config/settings.py`.
- Linting is configured with `ruff` via `pyproject.toml`.
