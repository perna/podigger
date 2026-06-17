# Tasks: Fix Backend Lint

**Input**: Design documents from `/specs/001-fix-backend-lint/`

**Prerequisites**: plan.md, spec.md, research.md

**Organization**: Tasks organized by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/<app>/` (Django app directories)
- **Config**: `ruff.toml` (root), `backend/pyproject.toml`
- **CI**: `.github/workflows/ci.yml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Consolidate Ruff configuration and prepare for formatting

- [X] T001 [P] Review and consolidate Ruff configuration in ruff.toml
- [X] T002 [P] Remove duplicate Ruff config from backend/pyproject.toml (keep only project metadata)
- [X] T003 [P] Verify Ruff rules alignment between root and backend configs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure Ruff configuration is correct and CI is ready

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Run `ruff check .` in backend/ to verify lint rules pass
- [X] T005 Run `ruff format --check .` in backend/ to identify formatting issues
- [X] T006 Update CI workflow to run both `ruff check` and `ruff format --check`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Stable CI Pipeline (Priority: P1) 🎯 MVP

**Goal**: Backend linting passes consistently in CI without manual intervention

**Independent Test**: Run CI pipeline and verify lint checks pass without errors

### Implementation for User Story 1

- [X] T007 [US1] Auto-format all backend files with `ruff format .`
- [X] T008 [US1] Verify `ruff check .` passes in backend/
- [X] T009 [US1] Verify `ruff format --check .` passes in backend/
- [X] T010 [US1] Test CI workflow locally with `act` or manual trigger

**Checkpoint**: User Story 1 complete - CI pipeline passes lint checks

---

## Phase 4: User Story 2 - Django-Specific Lint Rules (Priority: P2)

**Goal**: Linting configuration understands Django patterns and conventions

**Independent Test**: Run lint on Django code and verify consistent style enforcement

### Implementation for User Story 2

- [X] T011 [P] [US2] Verify DJ (Django) rules are enabled in ruff.toml
- [X] T012 [P] [US2] Verify per-file-ignores for Django apps (settings.py, apps.py)
- [X] T013 [US2] Test Django models with `__str__` method pass lint
- [X] T014 [US2] Test Django views with decorators pass lint
- [X] T015 [US2] Test Django URL patterns pass lint

**Checkpoint**: User Story 2 complete - Django patterns handled correctly

---

## Phase 5: User Story 3 - Consistent Code Quality (Priority: P3)

**Goal**: Lint configuration enforces consistent code quality standards

**Independent Test**: Review lint configuration and verify reasonable standards

### Implementation for User Story 3

- [X] T016 [P] [US3] Document Ruff configuration decisions in research.md
- [X] T017 [P] [US3] Add pre-commit hook configuration (optional)
- [X] T018 [US3] Run quickstart.md validation scenarios
- [X] T019 [US3] Verify no regressions in existing tests

**Checkpoint**: All user stories complete - consistent code quality achieved

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T020 [P] Run full test suite (`pytest -v`)
- [X] T021 [P] Verify CI pipeline passes on PR
- [X] T022 Update CHANGELOG.md with lint fix entry
- [ ] T023 Commit all changes with conventional commit message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- US2 tasks T011 and T012 can run in parallel
- US3 tasks T016 and T017 can run in parallel
- Final phase tasks T020 and T021 can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch both Django config verification tasks together:
Task: "Verify DJ rules enabled in ruff.toml"
Task: "Verify per-file-ignores for Django apps"

# Then run Django-specific tests:
Task: "Test Django models with __str__ method"
Task: "Test Django views with decorators"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (consolidate config)
2. Complete Phase 2: Foundational (verify config, update CI)
3. Complete Phase 3: User Story 1 (auto-format, verify CI)
4. **STOP and VALIDATE**: CI pipeline passes lint checks
5. Deploy if ready

### Incremental Delivery

1. Complete Setup + Foundational → Config consolidated
2. Add User Story 1 → CI passes → Deploy (MVP!)
3. Add User Story 2 → Django rules verified → Deploy
4. Add User Story 3 → Quality standards documented → Deploy
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently