# Tasks: CRUD de Podcasts

**Input**: Design documents from `/specs/002-podcast-crud-api/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are included per constitution Principle II (Test Coverage Discipline) — tests MUST be written alongside feature code.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/podcasts/` for source code, `backend/podcasts/tests/` for tests
- All paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Review existing code and prepare for implementation

- [X] T001 Review existing `PodcastViewSet` in `backend/podcasts/views.py`, `PodcastService` in `backend/podcasts/services/podcast_service.py`, and serializers in `backend/podcasts/serializers.py` to understand current CRUD behavior per research.md findings
- [X] T002 [P] Verify existing test suite passes by running `make test` from project root to establish baseline before changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities that multiple user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `is_valid_url_format(url: str) -> bool` helper function in `backend/podcasts/services/feed_parser.py` using Django's `URLValidator` for fast synchronous URL format validation (used by US3 create and US4 update)

**Checkpoint**: Foundation ready — `is_valid_url_format` available for create and update operations

---

## Phase 3: User Story 1 - Listar podcasts com paginação e filtros (Priority: P1)

**Goal**: Enable language filtering on the podcast list endpoint alongside existing pagination and name search

**Independent Test**: `GET /api/podcasts/?language=1` returns only podcasts with that language ID; `GET /api/podcasts/?search=python` still works; pagination metadata present

### Tests for User Story 1

- [X] T004 [P] [US1] Write test for list podcasts with pagination (verify count, next, previous, results structure) in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T005 [P] [US1] Write test for list podcasts with search filter (`?search=term`) returning only matching podcasts in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T006 [P] [US1] Write test for list podcasts with language filter (`?language=<id>`) returning only podcasts of that language in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T007 [P] [US1] Write test for anonymous user accessing list endpoint receives 200 (public access) in `backend/podcasts/tests/test_podcast_crud.py`

### Implementation for User Story 1

- [X] T008 [US1] Add `DjangoFilterBackend` to `PodcastViewSet.filter_backends` and set `filterset_fields = ["language"]` in `backend/podcasts/views.py` to enable language filtering via query parameter

**Checkpoint**: List endpoint supports pagination, name search, and language filter. All US1 tests pass.

---

## Phase 4: User Story 2 - Visualizar detalhes de um podcast (Priority: P1)

**Goal**: Ensure retrieve endpoint returns full podcast details with nested episodes (already functional via DRF ModelViewSet)

**Independent Test**: `GET /api/podcasts/{id}/` returns 200 with all fields and nested episodes; `GET /api/podcasts/99999/` returns 404

### Tests for User Story 2

- [X] T009 [P] [US2] Write test for retrieve podcast detail returns 200 with all fields (name, feed, image, language, total_episodes) and nested episodes in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T010 [P] [US2] Write test for retrieve non-existent podcast returns 404 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T011 [P] [US2] Write test for anonymous user accessing retrieve endpoint receives 200 (public access) in `backend/podcasts/tests/test_podcast_crud.py`

### Implementation for User Story 2

- [X] T012 [US2] Verify existing `PodcastViewSet.retrieve` behavior and `PodcastDetailSerializer` output match contract in `specs/002-podcast-crud-api/contracts/podcast-crud-api.md` — no code changes expected; document any discrepancies

**Checkpoint**: Retrieve endpoint returns full detail with episodes. All US2 tests pass.

---

## Phase 5: User Story 3 - Cadastrar um novo podcast (Priority: P1)

**Goal**: Refactor podcast creation to use synchronous URL format validation and asynchronous RSS content validation via Celery

**Independent Test**: POST with valid name+feed returns 201; POST with malformed URL returns 400; POST with duplicate feed returns 200; POST without auth returns 401/403

### Tests for User Story 3

- [X] T013 [P] [US3] Write test for create podcast with valid name and feed returns 201 with id and status "created" in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T014 [P] [US3] Write test for create podcast with duplicate feed returns 200 with existing id and status "none" in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T015 [P] [US3] Write test for create podcast with malformed feed URL returns 400 with descriptive error in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T016 [P] [US3] Write test for create podcast with empty name returns 400 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T017 [P] [US3] Write test for create podcast enqueues `add_episode` Celery task on success in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T018 [P] [US3] Write test for anonymous user creating podcast receives 401/403 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T019 [P] [US3] Write test for reader-role user creating podcast receives 403 in `backend/podcasts/tests/test_podcast_crud.py`

### Implementation for User Story 3

- [X] T020 [US3] Refactor `PodcastService.create_podcast` in `backend/podcasts/services/podcast_service.py` to replace `is_valid_feed()` call with `is_valid_url_format()` for synchronous URL format validation only; remove synchronous RSS fetch from the request path
- [X] T021 [US3] Verify `add_episode.delay(feed)` is called after successful creation in `backend/podcasts/services/podcast_service.py` to handle async RSS content validation and episode import

**Checkpoint**: Create endpoint validates URL format synchronously, delegates RSS validation to Celery. All US3 tests pass.

---

## Phase 6: User Story 4 - Atualizar um podcast existente (Priority: P2)

**Goal**: Add custom update logic that detects feed URL changes, deletes old episodes, and triggers async re-import from the new feed

**Independent Test**: PATCH with name change returns 200 with updated name; PUT with new feed URL returns 200 and triggers re-import; PATCH with duplicate feed returns 400; PATCH without auth returns 401/403

### Tests for User Story 4

- [X] T022 [P] [US4] Write test for full update (PUT) with all fields returns 200 with updated data in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T023 [P] [US4] Write test for partial update (PATCH) changing only name returns 200 with updated name and other fields unchanged in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T024 [P] [US4] Write test for partial update (PATCH) changing only image returns 200 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T025 [P] [US4] Write test for update non-existent podcast returns 404 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T026 [P] [US4] Write test for update with feed URL already used by another podcast returns 400 with uniqueness error in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T027 [P] [US4] Write test for update with new feed URL deletes existing episodes and enqueues `reimport_feed` task in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T028 [P] [US4] Write test for update without feed change does NOT delete episodes or enqueue re-import in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T029 [P] [US4] Write test for anonymous user updating podcast receives 401/403 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T030 [P] [US4] Write test for reader-role user updating podcast receives 403 in `backend/podcasts/tests/test_podcast_crud.py`

### Implementation for User Story 4

- [X] T031 [US4] Add `PodcastUpdateSerializer` with writable fields (`name`, `feed`, `image`, `language`) and read-only `total_episodes` in `backend/podcasts/serializers.py`; include feed uniqueness validation that excludes the current podcast instance
- [X] T032 [US4] Add `update_podcast_feed(podcast, new_feed_url)` static method to `PodcastService` in `backend/podcasts/services/podcast_service.py` that deletes all episodes for the podcast and enqueues `reimport_feed` Celery task
- [X] T033 [US4] Add `reimport_feed` Celery shared task in `backend/podcasts/tasks.py` that accepts a podcast ID, looks up the podcast's current feed URL, and uses `EpisodeUpdater` to import episodes
- [X] T034 [US4] Add custom `update` and `partial_update` methods to `PodcastViewSet` in `backend/podcasts/views.py` that detect feed changes, delegate to `PodcastService.update_podcast_feed`, and return updated podcast data via `PodcastUpdateSerializer`
- [X] T035 [US4] Update `get_serializer_class` in `PodcastViewSet` in `backend/podcasts/views.py` to return `PodcastUpdateSerializer` for `update` and `partial_update` actions

**Checkpoint**: Update endpoint handles feed changes with re-import. All US4 tests pass.

---

## Phase 7: User Story 5 - Remover um podcast (Priority: P2)

**Goal**: Ensure destroy endpoint permanently removes podcast and all associated episodes via CASCADE (already functional via DRF ModelViewSet)

**Independent Test**: DELETE returns 204 and podcast+episodes are gone from DB; DELETE non-existent returns 404; DELETE without auth returns 401/403

### Tests for User Story 5

- [X] T036 [P] [US5] Write test for delete podcast returns 204 and removes podcast and all associated episodes from database in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T037 [P] [US5] Write test for delete non-existent podcast returns 404 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T038 [P] [US5] Write test for anonymous user deleting podcast receives 401/403 in `backend/podcasts/tests/test_podcast_crud.py`
- [X] T039 [P] [US5] Write test for reader-role user deleting podcast receives 403 in `backend/podcasts/tests/test_podcast_crud.py`

### Implementation for User Story 5

- [X] T040 [US5] Verify existing `PodcastViewSet.destroy` behavior and CASCADE deletion match contract in `specs/002-podcast-crud-api/contracts/podcast-crud-api.md` — no code changes expected; document any discrepancies

**Checkpoint**: Delete endpoint removes podcast and episodes. All US5 tests pass.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance across all user stories

- [X] T041 Run `make lint` from project root to verify all new and modified code passes Ruff linting with zero warnings
- [X] T042 Run `make test` from project root to verify all tests pass and coverage >= 70%
- [X] T043 Run quickstart.md validation scenarios from `specs/002-podcast-crud-api/quickstart.md` against a running local environment to verify end-to-end behavior
- [X] T044 [P] Verify permission matrix from `specs/002-podcast-crud-api/quickstart.md` (Scenario 6) is fully covered by tests in `backend/podcasts/tests/test_podcast_crud.py`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1, US2, US3 can proceed in parallel after Foundational
  - US4 depends on T003 (is_valid_url_format) from Foundational
  - US5 can proceed in parallel with any other story
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) — Depends on T003 (is_valid_url_format)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) — Depends on T003 (is_valid_url_format)
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) — No dependencies on other stories

### Within Each User Story

- Tests MUST be written alongside implementation (constitution Principle II)
- Tests marked [P] can be written in parallel (same file, independent test methods)
- Implementation tasks are sequential within each story
- Story complete before moving to next priority

### Parallel Opportunities

- T004-T007 (US1 tests) can all run in parallel
- T009-T011 (US2 tests) can all run in parallel
- T013-T019 (US3 tests) can all run in parallel
- T022-T030 (US4 tests) can all run in parallel
- T036-T039 (US5 tests) can all run in parallel
- US1, US2, US3, US5 can be implemented in parallel by different developers
- T041 and T044 can run in parallel

---

## Parallel Example: User Story 4

```text
# Launch all tests for User Story 4 together:
Task: "Write test for full update (PUT)..."
Task: "Write test for partial update (PATCH) changing only name..."
Task: "Write test for partial update (PATCH) changing only image..."
Task: "Write test for update non-existent podcast..."
Task: "Write test for update with duplicate feed..."
Task: "Write test for update with new feed URL triggers re-import..."
Task: "Write test for update without feed change..."
Task: "Write test for anonymous user updating..."
Task: "Write test for reader-role user updating..."

# Then implement sequentially:
Task: "Add PodcastUpdateSerializer..."
Task: "Add update_podcast_feed service method..."
Task: "Add reimport_feed Celery task..."
Task: "Add custom update/partial_update methods..."
Task: "Update get_serializer_class..."
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (List with filters)
4. Complete Phase 4: User Story 2 (Retrieve detail)
5. Complete Phase 5: User Story 3 (Create with async validation)
6. **STOP and VALIDATE**: Test US1-US3 independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (List) → Test independently → Deploy/Demo
3. Add US2 (Retrieve) → Test independently → Deploy/Demo
4. Add US3 (Create) → Test independently → Deploy/Demo (MVP!)
5. Add US4 (Update) → Test independently → Deploy/Demo
6. Add US5 (Delete) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (List) + US2 (Retrieve)
   - Developer B: US3 (Create)
   - Developer C: US4 (Update) + US5 (Delete)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files or independent test methods, no dependencies
- [Story] label maps task to specific user story for traceability
- All tests go in `backend/podcasts/tests/test_podcast_crud.py` as a single new test file
- No new models or migrations required (per data-model.md)
- Existing `PodcastViewSet` already provides list, retrieve, create, destroy via `ModelViewSet` — this feature extends and refactors existing behavior
- Commit after each task or logical group
