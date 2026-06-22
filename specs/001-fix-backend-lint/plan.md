# Implementation Plan: Fix Backend Lint

**Branch**: `001-fix-backend-lint` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fix-backend-lint/spec.md`

## Summary

The backend CI pipeline fails due to code style inconsistencies. The project uses Ruff as the sole linting and formatting tool, with configuration split between `ruff.toml` (root) and `backend/pyproject.toml`. While `ruff check` passes, `ruff format --check` fails on 7 files. The fix involves: (1) consolidating and aligning Ruff configuration, (2) auto-formatting all backend code, and (3) updating CI to run both check and format validation.

## Technical Context

**Language/Version**: Python 3.12

**Primary Dependencies**: Django 5.2.14, DRF 3.16.x, Ruff 0.8.x

**Storage**: PostgreSQL 15 (via psycopg2-binary)

**Testing**: pytest + pytest-django + pytest-mock + Hypothesis

**Target Platform**: Linux server (Docker, ubuntu-latest CI)

**Project Type**: Web application (Django backend + Next.js frontend)

**Performance Goals**: N/A (lint config feature)

**Constraints**: Must not break existing code; CI must pass on all PRs

**Scale/Scope**: ~56 Python files in backend/ (49 formatted, 7 need reformatting)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution.md found. No gates to evaluate.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-backend-lint/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── config/              # Django settings, URLs
├── accounts/            # Auth app
├── podcasts/            # Main app
├── pyproject.toml       # Ruff config (duplicate)
├── conftest.py          # Pytest fixtures
└── ...

ruff.toml                # Ruff config (root-level, primary)

.github/workflows/
└── ci.yml               # CI pipeline (lint step at line 101-104)
```

**Structure Decision**: Web application with frontend/backend split. Ruff config exists in two locations (ruff.toml at root, pyproject.toml in backend/) which may cause confusion. The root ruff.toml is the primary config file.

## Complexity Tracking

No constitution violations to justify.

## Research Findings

### Issue Analysis

1. **Root Cause**: `ruff format --check` fails on 7 files due to formatting inconsistencies
2. **Check vs Format**: `ruff check .` passes (lint rules OK), but `ruff format --check .` fails (formatting not applied)
3. **CI Gap**: CI only runs `ruff check .` (line 104 of ci.yml), not `ruff format --check .`
4. **Dual Config**: Two Ruff configurations exist - root `ruff.toml` and `backend/pyproject.toml` with slightly different rule sets

### Files Needing Reformatting

- `accounts/permissions.py`
- `accounts/serializers.py`
- `accounts/tests/test_cookie_auth.py`
- `accounts/tests/test_token_views.py`
- `conftest.py`
- `podcasts/tests/factories.py`
- `podcasts/tests/test_permissions.py`

### Recommendations

1. **Auto-format**: Run `ruff format .` in backend/ to fix all 7 files
2. **Consolidate config**: Remove duplicate Ruff config from `backend/pyproject.toml` or align them
3. **Update CI**: Add `ruff format --check .` step to CI pipeline
4. **Consider pre-commit**: Add pre-commit hooks to prevent future inconsistencies