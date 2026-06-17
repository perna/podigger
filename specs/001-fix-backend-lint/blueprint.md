# Blueprint: Fix Backend Lint

**Branch**: `001-fix-backend-lint` | **Date**: 2026-06-17
**Mode**: doc-only
**Total Tasks**: 23 | **Files**: 0 new, 4 modified, 0 deleted

## Key Decisions

- Consolidate Ruff configuration in root `ruff.toml` as single source of truth → T001, T002, T003
- Add `ruff format --check` step to CI pipeline alongside existing `ruff check` → T006
- Auto-format all backend files to fix 7 formatting inconsistencies → T007

## Implementation Order

```
Phase 1: Setup
├── T001: Review ruff.toml
├── T002: Clean pyproject.toml
└── T003: Verify rule alignment

Phase 2: Foundational (BLOCKS all user stories)
├── T004: Run ruff check
├── T005: Run ruff format --check
└── T006: Update CI workflow

Phase 3: US1 - Stable CI Pipeline (MVP)
├── T007: Auto-format all files
├── T008: Verify ruff check passes
├── T009: Verify ruff format --check passes
└── T010: Test CI locally

Phase 4: US2 - Django-Specific Rules
├── T011: Verify DJ rules enabled
├── T012: Verify per-file-ignores
├── T013: Test Django models
├── T014: Test Django views
└── T015: Test Django URLs

Phase 5: US3 - Consistent Code Quality
├── T016: Document decisions
├── T017: Add pre-commit config
├── T018: Run quickstart validation
└── T019: Verify no test regressions

Phase 6: Polish
├── T020: Run full test suite
├── T021: Verify CI on PR
├── T022: Update CHANGELOG
└── T023: Commit changes
```

---

## Phase 1: Setup (Shared Infrastructure)

### T001: Review and consolidate Ruff configuration in ruff.toml

**File**: `ruff.toml` (modify)

**Requirements**: FR-001, FR-002, FR-003

**Dependencies**: None

**Current state** (line 1-124):

```toml
# Configuração do Ruff para projetos Python/Django
# https://docs.astral.sh/ruff/

# Comprimento máximo de linha
line-length = 88

# Versão do Python alvo
target-version = "py312"

# Diretórios a serem excluídos
exclude = [
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "migrations",
    "staticfiles",
    "media",
    "node_modules",
    "build",
    "dist",
    "*.egg-info",
]

[lint]
# Regras ativadas
select = [
    "E",     # pycodestyle errors
    "W",     # pycodestyle warnings
    "F",     # pyflakes
    "I",     # isort
    "N",     # pep8-naming
    "UP",    # pyupgrade
    "B",     # flake8-bugbear
    "C4",    # flake8-comprehensions
    "DJ",    # flake8-django
    "DTZ",   # flake8-datetimez
    "T10",   # flake8-debugger
    "EM",    # flake8-errmsg
    "G",     # flake8-logging-format
    "PIE",   # flake8-pie
    "T20",   # flake8-print
    "PYI",   # flake8-pyi
    "PT",    # flake8-pytest-style
    "Q",     # flake8-quotes
    "RSE",   # flake8-raise
    "RET",   # flake8-return
    "SIM",   # flake8-simplify
    "TID",   # flake8-tidy-imports
    "TCH",   # flake8-type-checking
    "ARG",   # flake8-unused-arguments
    "PTH",   # flake8-use-pathlib
    "ERA",   # eradicate (código comentado)
    "PL",    # pylint
    "RUF",   # Ruff-specific rules
]

# Regras ignoradas
ignore = [
    "E501",    # Line too long (já controlado por line-length)
    "B008",    # Do not perform function calls in argument defaults (comum em Django)
    "RUF012",  # Mutable class attributes (comum em Django models)
    "DJ001",   # Avoid using null=True on string fields (flexibilidade)
    "PLR0913", # Too many arguments (flexível para views complexas)
    "PLR2004", # Magic value comparison (comum em código de negócio)
]

# Correções automáticas
fixable = ["ALL"]
unfixable = []

# Permitir imports não utilizados em __init__.py
[lint.per-file-ignores]
"__init__.py" = ["F401", "F403"]
"settings.py" = ["F405"]
"test_*.py" = ["ARG001", "ARG002"]
"*/tests/*" = ["ARG001", "ARG002"]
"conftest.py" = ["ARG001"]
"manage.py" = ["PLC0415", "EM101"]
"backend/podcasts/management/commands/seed_fake_podcasts.py" = ["PLR0915"]

[lint.isort]
# Configurações do isort
known-first-party = ["app"]  # Substitua por seu app principal
section-order = [
    "future",
    "standard-library",
    "django",
    "third-party",
    "first-party",
    "local-folder",
]

[lint.isort.sections]
"django" = ["django"]

[lint.flake8-quotes]
# Preferência por aspas duplas
inline-quotes = "double"
multiline-quotes = "double"

[lint.mccabe]
# Complexidade ciclomática máxima
max-complexity = 10

[lint.pylint]
# Máximo de argumentos em funções
max-args = 8
# Máximo de branches
max-branches = 15
# Máximo de statements
max-statements = 50

[format]
# Formatação automática
quote-style = "double"
indent-style = "space"
line-ending = "auto"
docstring-code-format = true
docstring-code-line-length = 72
```

**Action**: Review this file and ensure it includes all rules from `backend/pyproject.toml`. The root config is missing some rules that exist in the backend config:
- `C90` (mccabe)
- `D` (pydocstyle)
- `S` (bandit security)
- `A` (builtins)
- `ISC` (implicit-str-concat)
- `ICN` (import-conventions)
- `ASYNC` (flake8-async)
- `EXE` (flake8-executable)
- `FA` (flake8-future-annotations)
- `FLY` (flynt)
- `FURB` (refurb)
- `LOG` (flake8-logging)
- `PGH` (pygrep-hooks)
- `PERF` (perflint)
- `SLOT` (flake8-slots)
- `TRY` (tryceratops)

**Verification**: Run `ruff check --select ALL backend/` and verify no new errors appear

---

### T002: Remove duplicate Ruff config from backend/pyproject.toml

**File**: `backend/pyproject.toml` (modify)

**Requirements**: FR-001, FR-003

**Dependencies**: T001

**Current state** (lines 72-151):

```toml
[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = [
    "E", "W",    # pycodestyle
    "F",         # pyflakes
    "I",         # isort
    "C90",       # mccabe
    "N",         # pep8-naming
    "D",         # pydocstyle
    "UP",        # pyupgrade
    "S",         # bandit security
    "B",         # bugbear
    "A",         # builtins
    "C4",        # comprehensions
    "DTZ",       # datetimez
    "T10",       # debugger
    "DJ",        # django
    "EM",        # errmsg
    "ISC",       # implicit-str-concat
    "ICN",       # import-conventions
    "PIE",       # pie
    "PT",        # pytest-style
    "Q",         # quotes
    "RET",       # return
    "SIM",       # simplify
    "ARG",       # unused-arguments
    "PTH",       # use-pathlib
    "ERA",       # eradicate
    "PL",        # pylint
    "RUF",       # ruff-specific
    "ASYNC",     # flake8-async
    "EXE",       # flake8-executable
    "FA",        # flake8-future-annotations
    "FLY",       # flynt
    "FURB",      # refurb
    "G",         # flake8-logging-format
    "LOG",       # flake8-logging
    "PGH",       # pygrep-hooks
    "PERF",      # perflint
    "SLOT",      # flake8-slots
    "T20",       # flake8-print
    "TID",       # flake8-tidy-imports
    "TRY",       # tryceratops
    "TCH",       # flake8-type-checking
]
ignore = [
    "D100",      # Missing docstring in public module
    "D104",      # Missing docstring in public package
    "D101",      # Missing docstring in public class (optional, but common in rapid dev)
    "D102",      # Missing docstring in public method
    "D103",      # Missing docstring in public function
    "D105",      # Missing docstring in magic method
    "D106",      # Missing docstring in public nested class
    "D107",      # Missing docstring in __init__
    "DJ001",     # Avoid using null=True on string-based fields
    "TRY003",    # Avoid specifying long messages outside the exception class
    "ISC001",    # Avoid conflicts with the formatter
]

[tool.ruff.lint.per-file-ignores]
"**/tests/**/*.py" = ["S101", "E501", "S106", "PLR2004", "D", "ARG", "F811"]
"**/migrations/*.py" = ["E501", "D", "RUF012"]
"**/management/commands/*.py" = ["S311", "PLR2004", "E501", "D", "RUF012", "C901", "PLR0915", "ARG"]
"**/settings.py" = ["E501"]
"**/apps.py" = ["F401"]

[tool.ruff.lint.mccabe]
max-complexity = 10

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
```

**Action**: Remove the entire `[tool.ruff]` section (lines 72-151) from this file. Keep only project metadata, pytest, coverage, and commitizen configuration.

**New state after removal**:

```toml
[project]
name = "podigger-backend"
version = "0.1.0"
description = "Podigger Django Backend"
requires-python = ">=3.12,<3.13"
dependencies = [
    "Django==5.2.14",
    "djangorestframework>=3.16.1,<4.0",
    "psycopg2-binary==2.9.11",
    "django-cors-headers==4.0.0",
    "celery==5.6.3",
    "redis==8.0.0",
    "gunicorn>=26.0.0,<27.0",
    "uvicorn==0.49.0",
    "ruff>=0.8.0,<0.9.0",
    "django-environ>=0.10.0",
    "django-redis>=5.4.0",
    "Faker==19.9.0",
    "factory-boy>=3.3.3,<4.0",
    "django-filter>=23.2",
    "pytest>=7.0.0",
    "pytest-django>=4.0.0",
    "pytest-mock>=3.10.0",
    "feedparser>=6.0.12",
    "requests>=2.34.2",
    "djangorestframework-simplejwt>=5.5.1",
]



[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings"
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = """
    -v --tb=short --strict-markers
    --cov=podcasts --cov=accounts
    --cov-report=term-missing --cov-report=xml
    --cov-fail-under=70
"""
testpaths = ["podcasts/tests", "accounts/tests"]

[tool.coverage.run]
source = ["podcasts", "accounts"]
omit = ["*/tests/*", "*/migrations/*", "*/management/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
]

[tool.commitizen]
name = "cz_conventional_commits"
version = "0.1.0"
version_files = [
    "config/__version__.py:__version__",
    "pyproject.toml:version"
]
update_changelog_on_bump = true
tag_format = "v$version"
changelog_file = "../CHANGELOG.md"
changelog_incremental = true
changelog_start_rev = "HEAD"
```

**Verification**: Run `ruff check backend/` and verify it uses root config

---

### T003: Verify Ruff rules alignment between root and backend configs

**File**: `ruff.toml` (modify)

**Requirements**: FR-001, FR-002, FR-003

**Dependencies**: T001, T002

**Action**: After T001 and T002, run:
```bash
cd backend && uv run ruff check . --select ALL 2>&1 | head -50
```

If new errors appear, add missing ignore rules to `ruff.toml`:
- Add `D100`, `D104`, `D101`, `D102`, `D103`, `D105`, `D106`, `D107` to ignore list
- Add `TRY003` to ignore list
- Add `ISC001` to ignore list

**Verification**: `ruff check backend/` passes with no new errors

---

## Phase 2: Foundational (Blocking Prerequisites)

### T004: Run `ruff check .` in backend/ to verify lint rules pass

**File**: N/A (verification only)

**Requirements**: FR-001, FR-005

**Dependencies**: T001, T002, T003

**Action**:
```bash
cd backend && uv run ruff check .
```

**Expected outcome**: All checks passed!

**Verification**: Exit code 0

---

### T005: Run `ruff format --check .` in backend/ to identify formatting issues

**File**: N/A (verification only)

**Requirements**: FR-001, FR-005

**Dependencies**: T001, T002, T003

**Action**:
```bash
cd backend && uv run ruff format --check .
```

**Expected outcome**: 7 files would be reformatted

**Verification**: List of files needing reformatting matches:
- `accounts/permissions.py`
- `accounts/serializers.py`
- `accounts/tests/test_cookie_auth.py`
- `accounts/tests/test_token_views.py`
- `conftest.py`
- `podcasts/tests/factories.py`
- `podcasts/tests/test_permissions.py`

---

### T006: Update CI workflow to run both `ruff check` and `ruff format --check`

**File**: `.github/workflows/ci.yml` (modify)

**Requirements**: FR-001, FR-007

**Dependencies**: T004, T005

**Current state** (lines 101-104):

```yaml
      - name: Run ruff (lint)
        run: |
          cd backend
          uv run ruff check .
```

**After** (replace lines 101-104):

```yaml
      - name: Run ruff (lint)
        run: |
          cd backend
          uv run ruff check .

      - name: Run ruff format check
        run: |
          cd backend
          uv run ruff format --check .
```

**Verification**: Push to a branch and verify CI runs both lint steps

---

## Phase 3: User Story 1 - Stable CI Pipeline (Priority: P1) 🎯 MVP

### T007: Auto-format all backend files with `ruff format .`

**File**: Multiple files (modify)

**Requirements**: FR-006

**Dependencies**: T006

**Action**:
```bash
cd backend && uv run ruff format .
```

**Files to be formatted**:
- `backend/accounts/permissions.py`
- `backend/accounts/serializers.py`
- `backend/accounts/tests/test_cookie_auth.py`
- `backend/accounts/tests/test_token_views.py`
- `backend/conftest.py`
- `backend/podcasts/tests/factories.py`
- `backend/podcasts/tests/test_permissions.py`

**Verification**: `ruff format --check .` returns exit code 0

---

### T008: Verify `ruff check .` passes in backend/

**File**: N/A (verification only)

**Requirements**: FR-001

**Dependencies**: T007

**Action**:
```bash
cd backend && uv run ruff check .
```

**Verification**: Exit code 0

---

### T009: Verify `ruff format --check .` passes in backend/

**File**: N/A (verification only)

**Requirements**: FR-001

**Dependencies**: T007

**Action**:
```bash
cd backend && uv run ruff format --check .
```

**Verification**: Exit code 0

---

### T010: Test CI workflow locally with `act` or manual trigger

**File**: N/A (verification only)

**Requirements**: FR-001, FR-007

**Dependencies**: T006, T007, T008, T009

**Action**:
```bash
# Option 1: Use act (if installed)
act push

# Option 2: Push to branch and verify GitHub Actions
git push origin 001-fix-backend-lint
```

**Verification**: CI pipeline passes all lint checks

---

## Phase 4: User Story 2 - Django-Specific Lint Rules (Priority: P2)

### T011: Verify DJ (Django) rules are enabled in ruff.toml

**File**: `ruff.toml` (modify)

**Requirements**: FR-002

**Dependencies**: T003

**Action**: Verify line 40 contains `"DJ",` in the select list

**Current state** (line 40):
```toml
    "DJ",    # flake8-django
```

**Verification**: `ruff check --select DJ backend/` runs without error

---

### T012: Verify per-file-ignores for Django apps (settings.py, apps.py)

**File**: `ruff.toml` (modify)

**Requirements**: FR-002

**Dependencies**: T003

**Action**: Verify these entries exist in `[lint.per-file-ignores]`:
- `"settings.py" = ["F405"]`
- `"manage.py" = ["PLC0415", "EM101"]`

**Current state** (lines 79, 83):
```toml
"settings.py" = ["F405"]
"manage.py" = ["PLC0415", "EM101"]
```

**Verification**: `ruff check backend/config/settings.py` passes

---

### T013: Test Django models with `__str__` method pass lint

**File**: N/A (verification only)

**Requirements**: FR-002

**Dependencies**: T011, T012

**Action**:
```bash
cd backend && uv run ruff check --select DJ podcasts/models.py accounts/models.py
```

**Verification**: No Django-specific violations

---

### T014: Test Django views with decorators pass lint

**File**: N/A (verification only)

**Requirements**: FR-002

**Dependencies**: T011, T012

**Action**:
```bash
cd backend && uv run ruff check --select DJ podcasts/views.py accounts/views.py
```

**Verification**: No Django-specific violations

---

### T015: Test Django URL patterns pass lint

**File**: N/A (verification only)

**Requirements**: FR-002

**Dependencies**: T011, T012

**Action**:
```bash
cd backend && uv run ruff check --select DJ podcasts/urls.py accounts/urls.py config/urls.py
```

**Verification**: No Django-specific violations

---

## Phase 5: User Story 3 - Consistent Code Quality (Priority: P3)

### T016: Document Ruff configuration decisions in research.md

**File**: `specs/001-fix-backend-lint/research.md` (already exists)

**Requirements**: FR-003

**Dependencies**: T001, T002, T003

**Action**: Update research.md with final configuration decisions

**Verification**: Document reflects actual configuration

---

### T017: Add pre-commit hook configuration (optional)

**File**: `.pre-commit-config.yaml` (new)

**Requirements**: FR-003

**Dependencies**: T001, T002

**Action**: Create `.pre-commit-config.yaml` at repository root:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.6
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

**Verification**: `pre-commit run --all-files` passes

---

### T018: Run quickstart.md validation scenarios

**File**: N/A (verification only)

**Requirements**: FR-001, FR-003

**Dependencies**: T007, T008, T009

**Action**: Follow quickstart.md steps:
```bash
cd backend
uv run ruff check .
uv run ruff format --check .
```

**Verification**: Both commands pass

---

### T019: Verify no regressions in existing tests

**File**: N/A (verification only)

**Requirements**: FR-004

**Dependencies**: T007

**Action**:
```bash
cd backend && uv run pytest -v --tb=short
```

**Verification**: All tests pass

---

## Phase 6: Polish & Cross-Cutting Concerns

### T020: Run full test suite (`pytest -v`)

**File**: N/A (verification only)

**Requirements**: FR-004

**Dependencies**: T007

**Action**:
```bash
cd backend && uv run pytest -v --tb=short --strict-markers
```

**Verification**: Exit code 0

---

### T021: Verify CI pipeline passes on PR

**File**: N/A (verification only)

**Requirements**: FR-001, FR-007

**Dependencies**: T006, T007, T008, T009

**Action**: Create PR and verify CI passes

**Verification**: GitHub Actions shows green checkmarks

---

### T022: Update CHANGELOG.md with lint fix entry

**File**: `CHANGELOG.md` (modify)

**Requirements**: FR-003

**Dependencies**: T021

**Action**: Add entry under `[Unreleased]`:

```markdown
### Fixed

- Fixed backend lint configuration to pass CI consistently
- Consolidated Ruff configuration in root `ruff.toml`
- Added `ruff format --check` step to CI pipeline
- Auto-formatted 7 backend files for consistent code style
```

**Verification**: CHANGELOG.md updated

---

### T023: Commit all changes with conventional commit message

**File**: N/A (git operation)

**Requirements**: FR-003

**Dependencies**: T022

**Action**:
```bash
git add -A
git commit -m "fix(backend): consolidate Ruff config and fix lint CI failures

- Consolidate Ruff configuration in root ruff.toml
- Remove duplicate config from backend/pyproject.toml
- Add ruff format --check step to CI pipeline
- Auto-format 7 backend files for consistent code style
- Add pre-commit hook configuration

Closes #001-fix-backend-lint"
```

**Verification**: `git log --oneline -1` shows commit

---

## Checklist

- [ ] T001: Review and consolidate Ruff configuration in ruff.toml
- [ ] T002: Remove duplicate Ruff config from backend/pyproject.toml
- [ ] T003: Verify Ruff rules alignment between root and backend configs
- [ ] T004: Run `ruff check .` in backend/ to verify lint rules pass
- [ ] T005: Run `ruff format --check .` in backend/ to identify formatting issues
- [ ] T006: Update CI workflow to run both `ruff check` and `ruff format --check`
- [ ] T007: Auto-format all backend files with `ruff format .`
- [ ] T008: Verify `ruff check .` passes in backend/
- [ ] T009: Verify `ruff format --check .` passes in backend/
- [ ] T010: Test CI workflow locally with `act` or manual trigger
- [ ] T011: Verify DJ (Django) rules are enabled in ruff.toml
- [ ] T012: Verify per-file-ignores for Django apps (settings.py, apps.py)
- [ ] T013: Test Django models with `__str__` method pass lint
- [ ] T014: Test Django views with decorators pass lint
- [ ] T015: Test Django URL patterns pass lint
- [ ] T016: Document Ruff configuration decisions in research.md
- [ ] T017: Add pre-commit hook configuration (optional)
- [ ] T018: Run quickstart.md validation scenarios
- [ ] T019: Verify no regressions in existing tests
- [ ] T020: Run full test suite (`pytest -v`)
- [ ] T021: Verify CI pipeline passes on PR
- [ ] T022: Update CHANGELOG.md with lint fix entry
- [ ] T023: Commit all changes with conventional commit message