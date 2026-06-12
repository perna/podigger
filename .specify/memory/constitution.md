<!--
Sync Impact Report
==================
- Version change: 1.0.0 -> 1.1.0
  Rationale: MINOR bump — corrected multiple drift items discovered during
  brownfield validation (removed obsolete Flask references, fixed package
  manager, branch naming, Prettier, test layout, integration test scope,
  JSON logging aspiration).
- Modified principles:
    * I — removed obsolete Flask `app/` references (fully migrated)
    * III — documented actual test layout (backend app/tests/, frontend
      __tests__/ + tests/)
    * IV — clarified integration tests live in app-level tests/ directories
      alongside unit tests (no separate contract/integration directories)
    * V — clarified JSON logging is aspirational; Django built-in logging
      is acceptable for now
- Added sections: n/a
- Removed sections:
    * Flask compatibility constraint in Technology Stack (fully migrated)
- Templates requiring updates:
    * .specify/templates/plan-template.md — ✅ will update backend/src/ and
      pages/ paths to match actual project layout
    * .specify/templates/tasks-template.md — ✅ will update backend/src/
      and test directory paths
    * .specify/templates/spec-template.md — n/a (generic)
- Follow-up TODOs:
    * Adopt structured JSON logging for backend (Principle V aspiration)
-->

# Podigger Constitution

## Core Principles

### I. Library-First / Domain-Driven Backend
Every backend capability is delivered as a self-contained Django app (or DRF
module) under `backend/` with a single, clearly stated purpose (e.g. podcasts,
accounts). Apps MUST be independently testable, must own their models /
serializers / views / services, and must not reach across app boundaries
except through explicit, documented service interfaces.

### II. API-First Contract
All cross-component communication (frontend ↔ backend, service ↔ service,
CI ↔ backend) MUST go through explicit HTTP API contracts. Contracts MUST be
captured in OpenAPI / Postman collections under `docs/postman/` and reviewed
before implementation. Breaking changes to a contract MUST be versioned via
the URL or a request header and announced in `CHANGELOG.md` under a
`BREAKING CHANGE` entry. Direct database access from the frontend is
forbidden.

### III. Test-First (NON-NEGOTIABLE)
TDD is mandatory for all production code: tests are written first, made to
fail (Red), the implementation is written to pass (Green), and only then is
the code refactored. The backend uses `pytest` + `pytest-django` with
coverage gates enforced in CI (`--cov-fail-under=70`). The frontend uses
Vitest with jsdom. Tests are organized as follows:
  - **Backend**: `backend/<app>/tests/test_*.py` (flat, per-app)
  - **Frontend**: `__tests__/` directories co-located with source code
    (e.g. `src/components/home/__tests__/`), plus a standalone
    `frontend/tests/` directory for cross-cutting test fixtures.
  No PR may be merged with failing tests or with coverage below the
  current configured threshold.

### IV. Integration & Contract Testing
In addition to unit tests, the following scenarios MUST be covered by
integration tests before they are considered done: new API endpoints or
changes to existing contracts, inter-service communication (including feed
parsing → persistence), shared schema migrations, and any flow that crosses
the frontend / backend boundary. Integration tests live in app-level
`tests/` directories (`backend/<app>/tests/`) alongside unit tests; they
are distinguished by using Django's test client (`APIClient`) and a real
test database. The CI pipeline MUST run the full test suite on every PR
targeting `main`.

### V. Observability, Versioning & Simplicity
- **Observability**: structured logging is required for the backend; every
  request and long-running task MUST emit a correlation identifier.
  Implementation via Django's built-in logging framework is acceptable;
  migrating to JSON-formatted logs (e.g. via python-json-logger) is an
  aspirational goal tracked separately.
- **Versioning**: the project follows Semantic Versioning managed by
  Commitizen. Commits MUST follow Conventional Commits; CI rejects non-
  compliant messages. `CHANGELOG.md` and the version file in
  `backend/config/__version__.py` are updated automatically on release.
- **Simplicity**: start with the smallest design that solves the stated
  problem. YAGNI applies — speculative abstractions, premature optimization,
  and unused configuration MUST be justified in writing before introduction.

## Technology Stack & Constraints

- **Backend**: Python 3.12.7, Django + Django REST Framework, dependency
  management via UV (development) and `pip` (CI), migrations via Django's
  built-in migration framework.
- **Frontend**: Node.js 24 LTS, Next.js + TypeScript + Tailwind CSS,
  package manager npm.
- **Data & infrastructure**: PostgreSQL for persistence, Redis for cache and
  future queue needs, Docker Compose for local services (Postgres, Redis,
  Nginx reverse proxy).
- **Quality tooling**: Ruff for Python linting and formatting; ESLint for
  the frontend. Coverage is measured by `pytest --cov` on the backend.
- **CI/CD & security**: GitHub Actions for CI, Dependabot for dependency
  updates, Conventional Commits + Commitizen for versioning, semantic
  release workflow on merge to `main`.
- **Compatibility**: all code targets the Django backend exclusively. The
  project has been fully migrated from Flask to Django.

## Development Workflow & Quality Gates

- **Branching**: feature work happens on dedicated branches named
  `type/description` (e.g. `feat/*`, `fix/*`, `chore/*`, `refactor/*`) and
  is merged via pull request to `main` or `develop`. No direct pushes to
  `main` are permitted.
- **Code review**: every PR requires at least one approving review. Reviewers
  MUST verify Constitution compliance, test coverage of the change, and
  adherence to Conventional Commits.
- **Quality gates (CI)**: lint, format check, unit tests, integration tests,
  and coverage threshold MUST all pass. Conventional Commits validation MUST
  pass on every PR.
- **Database changes**: any model change MUST ship with a checked-in Django
  migration. Migrations MUST be reviewed for reversibility and data safety.
- **Documentation**: user-facing changes MUST update the relevant doc under
  `docs/` and the `CHANGELOG.md` `## [Unreleased]` section. Specs, plans,
  and tasks live under `.specs/` and `.specify/` and MUST be kept in sync
  with shipped code.
- **Spec Kit compliance**: every non-trivial change MUST go through the
  Spec-Kit cycle (specify → plan → tasks → implement) and pass the
  Constitution Check gate defined in `.specify/templates/plan-template.md`.

## Governance

This Constitution is the highest-authority development guidance for
Podigger; it supersedes informal practices and conflicting README
statements. Amendments require a documented proposal (a PR that updates
this file together with the Sync Impact Report at the top of the file),
maintainer review, and a passing CI run. Versioning of this document
follows Semantic Versioning:

- **MAJOR** — backward-incompatible governance changes, principle removals,
  or redefinitions.
- **MINOR** — new principle, section, or materially expanded guidance.
- **PATCH** — clarifications, wording fixes, non-semantic refinements.

Compliance review expectations:

- All PRs and code reviews MUST verify that the change complies with the
  principles above; the `plan-template.md` Constitution Check gate is the
  operational surface for that verification.
- Any violation MUST be justified in the `Complexity Tracking` section of
  the plan, with the simpler alternative explicitly rejected.
- Runtime development guidance is maintained in `README.dev.md`,
  `README.versioning.md`, and `GEMINI.md`; when they conflict with this
  Constitution, this document wins.

**Version**: 1.1.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-11
