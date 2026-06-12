# Implementation Plan: Listagem de Podcasts

**Branch**: `001-podcast-listing` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-podcast-listing/spec.md`

## Summary

This feature delivers a dedicated podcast listing page (`/podcasts`) with paginated browsing, text search by podcast name, and language filtering. The backend requires enhancements to the existing `PodcastViewSet` (language filter, `PodcastLanguage` endpoint, pagination metadata in the serializer) and the frontend requires a new page route (`/podcasts`) with reusable listing/search/pagination components.

## Technical Context

**Language/Version**: Backend: Python 3.12.7; Frontend: TypeScript (Node.js 24 LTS)

**Primary Dependencies**: Backend: Django 5.2 + Django REST Framework; Frontend: Next.js 16 + React 19 + Tailwind CSS v4

**Storage**: PostgreSQL (existing `podcasts_podcast`, `podcasts_podcastlanguage` tables)

**Testing**: Backend: pytest + pytest-django; Frontend: Vitest + @testing-library/react

**Target Platform**: Web application (server: Linux, client: browser, mobile-responsive)

**Project Type**: Web application (Django REST API backend + Next.js frontend)

**Performance Goals**: List page loads first 20 results in <3s; page transitions <2s; search <10s to find target

**Constraints**: Public access (no auth required for listing/search); must reuse existing models/serializers; page_size default 20

**Scale/Scope**: ~50-200 podcasts initially; 2 new Django apps reuse (no new app needed); 1 new frontend page; ~3 modified existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Library-First / Domain-Driven Backend | ✅ PASS | Podcast logic remains in the existing `podcasts/` Django app. No new app needed — enhancements to `PodcastViewSet` and serializers stay within the app boundary. New `PodcastLanguage` ViewSet is a read-only endpoint within the same app. |
| II. API-First Contract | ✅ PASS | API contract defined in `contracts/podcasts-api.md`. All frontend-backend communication through explicit REST endpoints. No direct DB access from frontend. |
| III. Test-First (NON-NEGOTIABLE) | ✅ PASS | Tests written first (Red → Green → Refactor). Backend: `backend/podcasts/tests/test_api.py` extended. Frontend: `__tests__/` co-located with new page/component. Coverage gates enforced. |
| IV. Integration & Contract Testing | ✅ PASS | New API endpoints/contract changes covered by integration tests using `APIClient` with real test DB. Frontend-backend boundary tested via mocked API in Vitest. |
| V. Observability, Versioning & Simplicity | ✅ PASS | No new services or infrastructure. Changes are minimal deltas on existing code. Correlation ID already provided by Django middleware. Simplest design: enhance existing viewset, not create new one. |
| Technology Stack & Constraints | ✅ PASS | All within declared stack: Django + DRF, Next.js + TypeScript + Tailwind, PostgreSQL, pytest + Vitest. |
| Spec Kit Compliance | ✅ PASS | Following specify → plan → tasks → implement cycle. |

**Gate Result**: ALL PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-podcast-listing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── podcasts-api.md  # API contract for podcast listing endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── podcasts/                    # Existing Django app (MODIFIED)
│   ├── models.py                # [NO CHANGE] Podcast, PodcastLanguage models
│   ├── views.py                 # [MODIFIED] Add language filter, language list endpoint
│   ├── serializers.py           # [MODIFIED] Add language object serialization, pagination metadata
│   ├── urls.py                  # [MODIFIED] Register language endpoint
│   └── tests/
│       ├── test_api.py          # [MODIFIED] Add language filter + list tests
│       └── test_views_features.py  # [MODIFIED] Add language endpoint tests
├── config/
│   └── settings.py              # [NO CHANGE] Existing REST_FRAMEWORK config

frontend/
├── src/
│   ├── app/
│   │   └── podcasts/
│   │       ├── page.tsx         # [NEW] Server component wrapper
│   │       └── __tests__/
│   │           └── page.test.tsx  # [NEW] Page integration tests
│   ├── components/
│   │   ├── podcasts/
│   │   │   ├── PodcastCard.tsx    # [MODIFIED] Show language name alongside episode count
│   │   │   ├── PodcastList.tsx    # [NEW] Client component with search, filter, pagination
│   │   │   ├── LanguageFilter.tsx # [NEW] Language dropdown/chip filter
│   │   │   ├── Pagination.tsx     # [NEW] Anterior/Próximo navigation component
│   │   │   └── __tests__/
│   │   │       ├── PodcastCard.test.tsx      # [NEW]
│   │   │       ├── PodcastList.test.tsx      # [NEW]
│   │   │       ├── LanguageFilter.test.tsx   # [NEW]
│   │   │       └── Pagination.test.tsx       # [NEW]
│   │   └── ui/
│   │       └── Loading.tsx       # [NO CHANGE] Existing Skeleton, LoadingSpinner
│   └── lib/
│       ├── api.ts                # [MODIFIED] Add fetchLanguages, update Podcast interface
│       └── __tests__/
│           └── api.test.ts       # [MODIFIED] Add fetchLanguages tests
```

**Structure Decision**: Web application (Option 2). This feature modifies the existing `podcasts/` Django app and adds a new `/podcasts` route in the Next.js App Router. No new Django app needed — the podcast listing domain naturally belongs to the existing `podcasts` app.

## Complexity Tracking

> No violations to justify. All Constitution gates pass.
