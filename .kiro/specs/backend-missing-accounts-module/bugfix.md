# Bugfix Requirements Document

## Introduction

The Django backend crashes in the staging environment with `ModuleNotFoundError: No module named 'accounts'` because the Dockerfile.production does not copy the `accounts` directory into the container image. While the `accounts` module is listed in INSTALLED_APPS and exists in the source code (`backend/accounts/`), it is not included in the COPY instructions alongside `config` and `podcasts`, causing Gunicorn to fail during application startup.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the production Docker image is built THEN the system copies only `config` and `podcasts` directories, omitting the `accounts` directory

1.2 WHEN Gunicorn attempts to start the Django application THEN the system crashes with `ModuleNotFoundError: No module named 'accounts'` because the module listed in INSTALLED_APPS is not present in the container filesystem

1.3 WHEN the container starts in staging environment THEN the system fails to serve any requests due to the missing `accounts` module

### Expected Behavior (Correct)

2.1 WHEN the production Docker image is built THEN the system SHALL copy the `accounts` directory into the container alongside `config` and `podcasts`

2.2 WHEN Gunicorn attempts to start the Django application THEN the system SHALL successfully load all modules listed in INSTALLED_APPS, including `accounts`, without errors

2.3 WHEN the container starts in staging environment THEN the system SHALL start successfully and be ready to serve requests

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the production Docker image is built THEN the system SHALL CONTINUE TO copy the `config` directory into the container

3.2 WHEN the production Docker image is built THEN the system SHALL CONTINUE TO copy the `podcasts` directory into the container

3.3 WHEN the production Docker image is built THEN the system SHALL CONTINUE TO copy `manage.py`, `pyproject.toml`, and `pytest.ini` files into the container

3.4 WHEN Gunicorn starts with the fixed image THEN the system SHALL CONTINUE TO successfully load the `config` and `podcasts` modules as before

3.5 WHEN collectstatic runs during the build THEN the system SHALL CONTINUE TO collect static files without errors
