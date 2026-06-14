# Implementation Plan: CRUD de Podcasts

**Branch**: `002-podcast-crud-api` | **Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-podcast-crud-api/spec.md`

## Summary

Complete the podcast CRUD API by extending the existing `PodcastViewSet` with proper
update logic (feed change triggers re-import), language filtering on list, asynchronous
feed content validation on create, and comprehensive test coverage. The existing viewset
already provides list, retrieve, create, and destroy via DRF `ModelViewSet`; this feature
adds the missing update behavior, refactors create validation to async RSS checks, and
adds a language filter backend.

## Technical Context

**Language/Version**: Python 3.12
**Primary Dependencies**: Django 5.2 + DRF 3.16, Celery 5.5, feedparser 6.0
**Storage**: PostgreSQL with pg_trgm extension, Redis 7.1 (Celery broker + cache)
**Testing**: pytest + pytest-django + pytest-mock + pytest-cov >= 70%
**Target Platform**: Web (Linux server via Docker)
**Project Type**: Web application (Django REST API backend)
**Performance Goals**: List endpoint <2s, create endpoint <3s (per SC-001, SC-002)
**Constraints**: Public read access (AllowAny), write access restricted to editor/admin (IsEditorOrAdmin), paginated responses (page_size=10), Portuguese error messages
**Scale/Scope**: Backend-only — modifies existing viewset, service, and tasks; adds new tests. No frontend changes. No new models or migrations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. API-First Design
- ✅ All logic originates in Django backend REST endpoints
- ✅ Existing `/api/podcasts/` router already registered; no new URL prefixes needed
- ✅ DRF serializers define the contract; `PodcastListSerializer` and `PodcastDetailSerializer` reused
- ✅ Cross-cutting concerns (pagination, filtering, permissions) enforced at API layer

### II. Test Coverage Discipline
- ⚠️ New tests MUST cover: update with feed change, update without feed change, destroy with cascade, permission enforcement (anonymous/editor/admin/reader), language filter, feed URL format validation
- ✅ Backend `make test` runs pytest with `--cov-fail-under=70`
- ✅ Test files follow `test_*.py` naming convention

### III. Code Quality & Linting
- ✅ All new code MUST pass Ruff linting (`make lint`)
- ✅ Google-style docstrings required (pydocstyle convention in `ruff.toml`)
- ✅ No warnings tolerated

### IV. Container-Native Development
- ✅ No new services needed — existing Docker Compose covers all dependencies
- ✅ Backend dev server available via `make backend-dev`

### V. Conventional Versioning
- ✅ Commit type: `feat` (new API behavior = new feature → MINOR bump)
- ✅ Scope: `backend` (see `README.versioning.md` for suggested scopes)

### Gate Result: PASS — No violations requiring justification

### Post-Design Re-evaluation (Phase 1)
- ✅ I. API-First: All changes within existing `/api/podcasts/` endpoints; serializer contracts documented.
- ✅ II. Test Coverage: New test file `test_podcast_crud.py` covers all CRUD operations with permission matrix.
- ✅ III. Linting: Ruff compliance confirmed in design.
- ✅ IV. Container-Native: No new services.
- ✅ V. Conventional Versioning: Commit type `feat(backend)` as planned.
- **Gate Result: PASS**

## Project Structure

### Documentation (this feature)

```text
specs/002-podcast-crud-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── podcast-crud-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── podcasts/
│   ├── views.py                    # MODIFY: add update logic, language filter
│   ├── serializers.py              # MODIFY: add PodcastUpdateSerializer
│   ├── services/
│   │   ├── podcast_service.py      # MODIFY: refactor create_podcast validation, add update_podcast_feed
│   │   └── feed_parser.py          # MODIFY: add is_valid_url_format helper
│   ├── tasks.py                    # MODIFY: add reimport_feed task
│   └── tests/
│       ├── test_podcast_crud.py    # NEW: comprehensive CRUD tests
│       ├── test_api.py             # EXISTING: no changes
│       └── test_views_features.py  # EXISTING: no changes
```

**Structure Decision**: All changes are within the existing `backend/podcasts/` app.
The `PodcastViewSet` is extended with custom `update`/`partial_update` methods that
detect feed changes and delegate to `PodcastService.update_podcast_feed`. A new
`PodcastUpdateSerializer` handles writable fields for update operations. A new
`reimport_feed` Celery task handles feed re-import on update. One new test file
`test_podcast_crud.py` provides comprehensive coverage for all CRUD operations
including permission matrix.

## Complexity Tracking

> No violations — all gates passed.
