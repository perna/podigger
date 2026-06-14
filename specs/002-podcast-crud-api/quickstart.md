# Quickstart: CRUD de Podcasts

**Date**: 2026-06-13 | **Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Docker Compose running (`make up` or `docker compose -f docker-compose.local.yml up`)
- Backend accessible at `http://localhost:8000`
- At least one user with `editor` or `admin` role created in the database
- Redis and Celery worker running for async tasks

## Authentication Setup

Obtain a JWT token for authenticated requests:

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "editor@example.com", "password": "password123"}'
```

Use the returned `access` token in subsequent requests:

```bash
-H "Authorization: Bearer <access_token>"
```

## Validation Scenarios

### Scenario 1: List Podcasts (Public)

```bash
# No auth required
curl http://localhost:8000/api/podcasts/

# With search filter
curl "http://localhost:8000/api/podcasts/?search=python"

# With language filter
curl "http://localhost:8000/api/podcasts/?language=1"

# With pagination
curl "http://localhost:8000/api/podcasts/?page=2"
```

**Expected**: 200 with paginated results containing `count`, `next`, `previous`, `results`.

### Scenario 2: Retrieve Podcast Detail (Public)

```bash
curl http://localhost:8000/api/podcasts/1/
```

**Expected**: 200 with full podcast data including nested episodes.
**Expected (not found)**: 404 with `{"detail": "Not found."}`.

### Scenario 3: Create Podcast (Authenticated)

```bash
curl -X POST http://localhost:8000/api/podcasts/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Podcast", "feed": "https://valid-feed.com/rss"}'
```

**Expected**: 201 with `{"id": <int>, "status": "created"}`.
**Expected (duplicate)**: 200 with `{"id": <int>, "message": "...", "status": "none"}`.
**Expected (invalid URL)**: 400 with error message.
**Expected (no auth)**: 401 or 403.

### Scenario 4: Update Podcast (Authenticated)

```bash
# Partial update — change name only
curl -X PATCH http://localhost:8000/api/podcasts/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Full update — change feed (triggers re-import)
curl -X PUT http://localhost:8000/api/podcasts/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated", "feed": "https://new-feed.com/rss", "image": "", "language": 1}'
```

**Expected**: 200 with updated podcast data.
**Expected (feed conflict)**: 400 with feed uniqueness error.
**Expected (no auth)**: 401 or 403.

### Scenario 5: Delete Podcast (Authenticated)

```bash
curl -X DELETE http://localhost:8000/api/podcasts/1/ \
  -H "Authorization: Bearer <token>"
```

**Expected**: 204 No Content (empty body).
**Expected (not found)**: 404.
**Expected (no auth)**: 401 or 403.

### Scenario 6: Permission Matrix

| Operation | Anonymous | Reader | Editor | Admin |
|-----------|-----------|--------|--------|-------|
| List      | 200       | 200    | 200    | 200   |
| Retrieve  | 200       | 200    | 200    | 200   |
| Create    | 401/403   | 403    | 201    | 201   |
| Update    | 401/403   | 403    | 200    | 200   |
| Delete    | 401/403   | 403    | 204    | 204   |

## Running Tests

```bash
# From project root
make test

# Or directly in backend container
cd backend
pytest podcasts/tests/test_podcast_crud.py -v
```

**Expected**: All tests pass, coverage >= 70%.

## Contract Reference

See [contracts/podcast-crud-api.md](./contracts/podcast-crud-api.md) for full request/response schemas.
