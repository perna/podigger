# Implementation Plan: Página de Busca de Podcasts

**Branch**: `001-podcast-search-page` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-podcast-search-page/spec.md`

## Summary

A dedicated search destination page (`/search`) that consolidates podcast and episode search
into a single interface with type-filtering tabs (Todos/Podcasts/Episódios), pagination
(page_size=10), popular term suggestions (max 8), minimum 2-character input validation,
AbortController-based request cancellation, URL-based search state sharing
(`?q=&tab=&page=`), and proper loading/empty/error states. The feature leverages
existing backend search APIs (`/api/episodes/?q=`, `/api/podcasts/?search=`,
`/api/popular-terms/`) and existing frontend components
(`SearchHero`, `PodcastCard`, `EpisodeCard`, `EpisodeCardCompact`).

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5 (frontend)
**Primary Dependencies**: Django 5.2 + DRF 3.16 (backend), Next.js 16 + React 19 (frontend)
**Storage**: PostgreSQL with pg_trgm extension, Redis 7.1 (Celery broker)
**Testing**: pytest + pytest-django + pytest-cov >= 70% (backend), vitest + @testing-library/react (frontend)
**Target Platform**: Web (Linux server via Docker)
**Project Type**: Web application (Django REST API backend + Next.js SPA frontend)
**Performance Goals**: Search results visible in <3s (per SC-001), tab switching <1s (per SC-003)
**Constraints**: Public access (AllowAny, no auth required), paginated responses (page_size=10), Portuguese UI, min 2-char query validation (frontend), max 8 popular terms
**Scale/Scope**: Single new route (`/search`), zero new backend endpoints, 1 new client component + 5 supporting UI components + tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. API-First Design
- ✅ All data consumed through existing REST APIs (`/api/episodes/`, `/api/podcasts/`, `/api/popular-terms/`)
- ✅ No new backend logic needed — search ranking, PopularTerm tracking, and pagination already handled by DRF
- ✅ Frontend types mirror DRF serializer fields (already defined in `lib/api.ts`)

### II. Test Coverage Discipline
- ⚠️ New frontend component MUST have vitest tests (unit + integration)
- ✅ Backend search endpoints already covered by existing pytest tests
- ✅ 70% backend coverage maintained (no backend changes)

### III. Code Quality & Linting
- ✅ ESLint (`eslint-config-next`) for frontend — zero warnings tolerance
- ✅ Ruff rules unchanged — backend is not modified
- ✅ TypeScript strict mode enabled (existing `tsconfig.json`)

### IV. Container-Native Development
- ✅ No new services — existing Docker Compose setup covers all dependencies
- ✅ Frontend dev server already available via `make frontend-dev`

### V. Conventional Versioning
- ✅ Commit type: `feat` (new page = new feature → MINOR bump)
- ✅ Scope: `frontend` (see `README.versioning.md` for suggested scopes)

### Gate Result: PASS — No violations requiring justification

### Post-Design Re-evaluation (Phase 1)
- ✅ I. API-First: All data still consumed through existing REST APIs; no backend changes.
- ✅ II. Test Coverage: New components (FilterTabs, PodcastResults, EpisodeResults, PopularTerms, SearchPagination, SearchInput) each require vitest unit tests; SearchPageClient requires integration test. All listed in project structure.
- ✅ III. Linting: ESLint + TypeScript strict mode unchanged.
- ✅ IV. Container-Native: No new services.
- ✅ V. Conventional Versioning: Commit type `feat(frontend)` as planned.
- **Gate Result: PASS**

## Project Structure

### Documentation (this feature)

```text
specs/001-podcast-search-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── search-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   └── search/
│   │       ├── page.tsx              # Server component (thin wrapper)
│   │       └── SearchPageClient.tsx   # Client component (all logic)
│   ├── components/
│   │   ├── search/
│   │   │   ├── SearchHero.tsx        # Reused (no changes)
│   │   │   ├── FilterTabs.tsx        # NEW: Todos/Podcasts/Episódios tabs
│   │   │   ├── PodcastResults.tsx    # NEW: Podcast result grid
│   │   │   ├── EpisodeResults.tsx    # NEW: Episode result list
│   │   │   ├── PopularTerms.tsx      # NEW: Term chip suggestions
│   │   │   ├── SearchPagination.tsx  # NEW: Pagination controls
│   │   │   └── SearchInput.tsx       # NEW: Search input with min-2-char validation + Enter key
│   │   ├── home/
│   │   │   └── EpisodeList.tsx       # Reused (no changes)
│   │   └── podcasts/
│   │       └── PodcastCard.tsx       # Reused (no changes)
│   └── lib/
│       └── api.ts                    # Extended: +fetchPopularTerms
└── tests/
    └── app/
        └── search/
            └── SearchPageClient.test.tsx  # NEW: page integration tests

backend/
└── (no changes — existing APIs sufficient)
```

**Structure Decision**: Single new route `frontend/src/app/search/` with co-located client
component. Supporting UI components placed in `frontend/src/components/search/` alongside
the existing `SearchHero`. New `SearchInput` component encapsulates min-length validation and
Enter key handling. URL state sync via `useSearchParams` + `useRouter` with unified
`?q=&tab=&page=` query scheme. No backend modifications.

## Complexity Tracking

> No violations — all gates passed.
