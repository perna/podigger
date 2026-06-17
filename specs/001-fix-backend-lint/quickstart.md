# Quickstart: Fix Backend Lint

**Feature**: 001-fix-backend-lint
**Date**: 2026-06-17

## Prerequisites

- Python 3.12
- UV package manager
- Git

## Validation Steps

### 1. Verify Current State

```bash
# Check lint rules (should pass)
cd backend
uv run ruff check .

# Check formatting (currently fails on 7 files)
uv run ruff format --check .
```

### 2. Apply Formatting Fix

```bash
# Auto-format all files
cd backend
uv run ruff format .

# Verify formatting now passes
uv run ruff format --check .
```

### 3. Verify CI Configuration

```bash
# Check CI workflow includes both checks
grep -A 5 "Run ruff" .github/workflows/ci.yml
# Should show both:
#   uv run ruff check .
#   uv run ruff format --check .
```

### 4. Run Full Test Suite

```bash
# Ensure no regressions
cd backend
uv run ruff check .
uv run ruff format --check .
pytest -v --tb=short
```

## Expected Outcomes

- [x] `ruff check .` passes with no errors
- [x] `ruff format --check .` passes with no files to reformat
- [x] CI workflow runs both checks
- [x] All existing tests pass
- [x] No functional code changes (only formatting)

## Rollback

If issues arise:
```bash
# Revert formatting changes
cd backend
git checkout -- .
# Or revert specific files
git checkout -- accounts/permissions.py accounts/serializers.py
```