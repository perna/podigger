# Research: Fix Backend Lint

**Feature**: 001-fix-backend-lint
**Date**: 2026-06-17

## Decision Log

### D1: Primary Linting Tool

**Decision**: Use Ruff as the sole linting and formatting tool

**Rationale**: 
- Project already uses Ruff (v0.8.x in pyproject.toml)
- Ruff is faster than traditional tools (flake8, black, isort)
- Single tool simplifies CI and developer workflow
- Django-specific rules available via DJ plugin

**Alternatives Considered**:
- flake8 + black + isort: More tools to maintain, slower
- pylint: Heavier, more opinionated
- ruff + black: Redundant (ruff handles formatting)

### D2: CI Lint Check Strategy

**Decision**: Run both `ruff check` and `ruff format --check` in CI

**Rationale**:
- `ruff check` validates code quality rules (errors, warnings, Django patterns)
- `ruff format --check` validates code formatting (spacing, quotes, line length)
- Both must pass for code to be considered clean
- Current CI only runs `ruff check`, missing formatting issues

**Alternatives Considered**:
- Only `ruff check`: Misses formatting inconsistencies
- Auto-format in CI: Not recommended (changes should be committed by developers)
- Use pre-commit hooks: Good complement but not sufficient alone

### D3: Ruff Configuration Consolidation

**Decision**: Keep root `ruff.toml` as primary config, remove duplicate from `backend/pyproject.toml`

**Rationale**:
- Root config is the standard location for monorepo setups
- Prevents confusion about which config is active
- Simplifies maintenance (single source of truth)
- Backend-specific overrides can use `[tool.ruff]` in pyproject.toml if needed

**Alternatives Considered**:
- Keep both configs: Risk of drift and confusion
- Use only pyproject.toml: Less conventional for multi-project repos

### D4: Auto-Fix Strategy

**Decision**: Run `ruff format .` to auto-fix all formatting issues

**Rationale**:
- 7 files need reformatting (minor changes)
- Auto-formatting is safe and deterministic
- No functional code changes, only whitespace/quote adjustments
- Can be done in a single commit

**Alternatives Considered**:
- Manual formatting: Time-consuming, error-prone
- Gradual formatting: Unnecessary for small number of files

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Formatting changes obscure git blame | Low | Use `git blame -w` to ignore whitespace |
| Config consolidation breaks local dev | Low | Test locally before committing |
| CI step addition increases build time | Minimal | `ruff format --check` is fast (<1s) |

## Open Questions

None - all research complete.