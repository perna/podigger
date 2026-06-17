# CI Lint Contract

**Feature**: 001-fix-backend-lint
**Date**: 2026-06-17

## Expected CI Behavior

When a developer pushes code or opens a PR to `main` or `develop`:

### Lint Checks (must pass)

1. **`ruff check .`** - Code quality validation
   - No errors (E, W, F rules)
   - No Django-specific violations (DJ rules)
   - No import ordering issues (I rules)
   - No unused arguments (ARG rules) in non-test files

2. **`ruff format --check .`** - Code formatting validation
   - All files must be properly formatted
   - Double quotes for strings
   - Space indentation
   - 88 character line length

### Failure Behavior

- If either check fails, the CI job fails
- Developer must fix issues locally before merging
- No auto-formatting in CI (changes must be committed)

### Warning Behavior

- Style warnings (non-error rules) appear in output but don't fail CI
- Critical violations (errors) fail CI immediately

## Validation Commands

```bash
# Local validation (should match CI behavior)
cd backend
uv run ruff check .
uv run ruff format --check .

# Auto-fix formatting locally
uv run ruff format .
```