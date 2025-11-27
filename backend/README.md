Podigger backend (Django)

This folder contains a minimal Django 5.2.8 project skeleton used while migrating the original Flask app.

How to run (development):

1. Build containers using the repo-level compose file:

```bash
docker compose -f ../docker-compose.django.yml up --build
```

2. The Django dev server will be available at [http://localhost:8000](http://localhost:8000) (after `manage.py` and migrations run).

Dependency installation

- The Docker image installs Python packages using pip and the `backend/requirements.txt` file.
- To work locally, create and activate a virtual environment and install dependencies with pip:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

If you'd prefer a modern project manager (Poetry, PDM, etc.) we can add that later; for now we stick to the conventional pip workflow to keep the development flow simple.


Notes:
- Database credentials are read from environment variables in `config/settings.py`.
- Linting is configured with `ruff` via `pyproject.toml`.
