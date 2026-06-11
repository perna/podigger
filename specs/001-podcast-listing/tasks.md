# Tasks: Listagem de Podcasts

**Input**: Design documents from `specs/001-podcast-listing/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included (Constitution III mandates TDD — tests written first, Red → Green → Refactor)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/podcasts/` (Django app)
- **Frontend**: `frontend/src/` (Next.js)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal setup — project infrastructure already exists from prior features.

- [X] T001 Verify dev environment (docker compose up -d, uv sync, npm install) and run existing test suite to confirm baseline passes

---

## Phase 2: Foundational (Backend API Enhancements)

**Purpose**: Backend API changes that ALL user stories depend on. Language serialization, pagination config, language endpoint, and language filter.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. All frontend stories depend on updated API contract.

### Tests for Foundational (write FIRST, ensure they FAIL)

- [X] T002 [P] Backend test for language nested serialization in GET /api/podcasts/ in backend/podcasts/tests/test_api.py
- [X] T003 [P] Backend test for pagination metadata (page_size=20, count/next/previous) in backend/podcasts/tests/test_api.py
- [X] T004 [P] Backend test for language filter (?language=<id>) in backend/podcasts/tests/test_api.py
- [X] T005 [P] Backend test for GET /api/languages/ endpoint in backend/podcasts/tests/test_api.py
- [X] T006 [P] Backend test for search+language combined filter in backend/podcasts/tests/test_api.py

### Implementation for Foundational

- [X] T007 [P] Add PodcastLanguageSerializer exposing id, code, name in backend/podcasts/serializers.py
- [X] T008 [P] Update PodcastListSerializer language field to use nested PodcastLanguageSerializer in backend/podcasts/serializers.py
- [X] T009 [P] Update PodcastDetailSerializer language field to use nested PodcastLanguageSerializer in backend/podcasts/serializers.py
- [X] T010 Add PodcastPagination (PageNumberPagination, page_size=20, page_size_query_param=page_size) and apply to PodcastViewSet in backend/podcasts/views.py
- [X] T011 Add DjangoFilterBackend with filterset_fields=["language"] to PodcastViewSet in backend/podcasts/views.py
- [X] T012 Add PodcastLanguageViewSet (ReadOnlyModelViewSet, public, not paginated) in backend/podcasts/views.py
- [X] T013 Register language endpoint in DRF router in backend/podcasts/urls.py

**Checkpoint**: Backend foundational complete — all foundational tests pass. Frontend work can now begin.

---

## Phase 3: User Story 1 - Explorar todos os podcasts disponíveis (Priority: P1) 🎯 MVP

**Goal**: Visitor accesses `/podcasts` and sees a paginated grid of podcast cards (name, cover image placeholder, language name, episode count). Loading spinner during fetch. "Nenhum podcast encontrado" when catalog is empty.

**Independent Test**: Access `/podcasts` route — verify cards render with name/cover/language/episode-count. Verify empty state shows informative message.

### Tests for User Story 1 (write FIRST, ensure they FAIL)

- [X] T014 [P] [US1] Test for PodcastCard rendering language name in frontend/src/components/podcasts/__tests__/PodcastCard.test.tsx
- [X] T015 [P] [US1] Test for PodcastList renders grid of PodcastCards in frontend/src/components/podcasts/__tests__/PodcastList.test.tsx
- [X] T016 [P] [US1] Test for PodcastList loading state (spinner) in frontend/src/components/podcasts/__tests__/PodcastList.test.tsx
- [X] T017 [P] [US1] Test for PodcastList empty state (no podcasts) in frontend/src/components/podcasts/__tests__/PodcastList.test.tsx
- [X] T018 [P] [US1] Test for PodcastList error state with retry button in frontend/src/components/podcasts/__tests__/PodcastList.test.tsx

### Implementation for User Story 1

- [X] T019 [US1] Update PodcastCard to display language name (from podcast.language.name) alongside episode count in frontend/src/components/podcasts/PodcastCard.tsx
- [X] T020 [US1] Create PodcastList client component with fetchPodcasts call, grid layout, and loading/error/empty states in frontend/src/components/podcasts/PodcastList.tsx
- [X] T021 [US1] Create /podcasts page route as server component wrapper rendering PodcastList in frontend/src/app/podcasts/page.tsx
- [X] T022 [US1] Add Skeleton placeholder for podcast cards during loading in frontend/src/components/podcasts/PodcastList.tsx

**Checkpoint**: User Story 1 fully functional — `/podcasts` page shows paginated podcast grid with loading, empty, and error states.

---

## Phase 4: User Story 2 - Buscar podcasts por nome (Priority: P1)

**Goal**: User types in search field, results filter by podcast name after 300ms debounce. Clearing search restores full list. "Nenhum podcast encontrado para [termo]" shown for no-results.

**Independent Test**: Type "nerd" in search field — verify only matching podcasts appear. Clear search — verify full list returns.

### Tests for User Story 2 (write FIRST, ensure they FAIL)

- [X] T023 [P] [US2] Test for search input renders and calling fetchPodcasts with search param in frontend/src/components/podcasts/__tests__/PodcastList.test.tsx
- [X] T024 [P] [US2] Test for search empty-results message shows query term in frontend/src/components/podcasts/__tests__/PodcastList.test.tsx
- [X] T025 [P] [US2] Test for clearing search restores full list in frontend/src/components/podcasts/__tests__/PodcastList.test.tsx

### Implementation for User Story 2

- [X] T026 [US2] Add useDebounce hook (300ms) in frontend/src/lib/useDebounce.ts
- [X] T027 [US2] Add search input with debounce to PodcastList, wired to fetchPodcasts(query, page) in frontend/src/components/podcasts/PodcastList.tsx

**Checkpoint**: User Stories 1 AND 2 both work — browsing and searching podcasts are fully functional.

---

## Phase 5: User Story 3 - Navegar entre páginas da listagem (Priority: P2)

**Goal**: Pagination controls (Anterior/Próximo) at bottom of list. Buttons disabled at boundary pages. Page indicator shows current position.

**Independent Test**: With >20 podcasts, click "Próximo" — verify page 2 loads. Click "Anterior" — verify page 1 returns. Verify buttons disabled at first/last page.

### Tests for User Story 3 (write FIRST, ensure they FAIL)

- [X] T028 [P] [US3] Test for Pagination component renders Anterior/Próximo buttons in frontend/src/components/podcasts/__tests__/Pagination.test.tsx
- [X] T029 [P] [US3] Test for Anterior disabled on first page in frontend/src/components/podcasts/__tests__/Pagination.test.tsx
- [X] T030 [P] [US3] Test for Próximo disabled on last page (next === null) in frontend/src/components/podcasts/__tests__/Pagination.test.tsx
- [X] T031 [P] [US3] Test for page change callback fires on click in frontend/src/components/podcasts/__tests__/Pagination.test.tsx

### Implementation for User Story 3

- [X] T032 [US3] Create Pagination component with Anterior/Próximo buttons and page indicator in frontend/src/components/podcasts/Pagination.tsx
- [X] T033 [US3] Integrate Pagination into PodcastList — wire currentPage state, onPageChange handler, pass hasNext/hasPrevious from API response in frontend/src/components/podcasts/PodcastList.tsx

**Checkpoint**: User Stories 1, 2, AND 3 all work — full browsing, searching, and pagination functional.

---

## Phase 6: User Story 4 - Filtrar podcasts por idioma (Priority: P3)

**Goal**: Language filter dropdown populated from /api/languages/. Selecting a language filters results. Selecting "Todos os idiomas" restores full list. Filter combines with search term.

**Independent Test**: Select "Português" from dropdown — verify only PT podcasts appear. Select "Todos os idiomas" — verify full list returns. Search "nerd" + filter "Português" — verify both criteria applied.

### Tests for User Story 4 (write FIRST, ensure they FAIL)

- [X] T034 [P] [US4] Test for LanguageFilter fetches and renders language options in frontend/src/components/podcasts/__tests__/LanguageFilter.test.tsx
- [X] T035 [P] [US4] Test for selecting language calls onLanguageChange callback in frontend/src/components/podcasts/__tests__/LanguageFilter.test.tsx
- [X] T036 [P] [US4] Test for "Todos os idiomas" option restores unfiltered list in frontend/src/components/podcasts/__tests__/LanguageFilter.test.tsx

### Implementation for User Story 4

- [X] T037 [US4] Create LanguageFilter component with dropdown of languages + "Todos os idiomas" default option in frontend/src/components/podcasts/LanguageFilter.tsx
- [X] T038 [US4] Integrate LanguageFilter into PodcastList — wire selectedLanguage state, pass language param to fetchPodcasts, reset to page 1 on filter change in frontend/src/components/podcasts/PodcastList.tsx
- [X] T039 [US4] Update fetchPodcasts in frontend/src/lib/api.ts to accept optional language parameter and append ?language=<id> query param

**Checkpoint**: All 4 user stories functional. Full feature: browse, search, paginate, and filter by language.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final touches affecting multiple user stories.

- [X] T040 [P] Ensure public access (no auth required) — verify AllowAny on list/language endpoints via backend/podcasts/tests/test_views_features.py
- [X] T041 [P] Add Navbar link to /podcasts in frontend/src/components/layout/Navbar.tsx
- [X] T042 Run validation per quickstart.md — all 12 scenarios pass
- [X] T043 [P] Accessibility check: aria-labels on search input, language dropdown, pagination buttons
- [X] T044 [P] Mobile responsive check: grid adapts to single column, pagination remains usable on small screens

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on US1 (Phase 3) — search is added to the PodcastList component created in US1
- **User Story 3 (Phase 5)**: Depends on US1 (Phase 3) — pagination integrates into PodcastList
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) — needs language endpoint and filter; can run in parallel with US1-US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Standalone — builds the core listing page. No dependency on other stories.
- **User Story 2 (P1)**: Adds search to US1's PodcastList. Depends on US1.
- **User Story 3 (P2)**: Adds pagination to US1's PodcastList. Depends on US1.
- **User Story 4 (P3)**: Adds language filter. Depends only on Foundational (Phase 2). Can be developed in parallel with US2/US3 after US1 completes.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Core component before integration touches
- Verify at checkpoint before moving to next story

### Parallel Opportunities

- All Foundational tests (T002-T006) can run in parallel
- All Foundational implementation tasks (T007-T013) can run in parallel after tests written
- US1 tests (T014-T018) can run in parallel
- US2 tests (T023-T025) can run in parallel
- US3 tests (T028-T031) can run in parallel
- US4 tests (T034-T036) can run in parallel
- US2 and US3 can be developed in parallel after US1 completes
- US4 can be developed in parallel with US2/US3 (different component, no shared state)
- Polish tasks (T040-T044) can all run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tests together:
Task: "Backend test for language nested serialization in backend/podcasts/tests/test_api.py"
Task: "Backend test for pagination metadata in backend/podcasts/tests/test_api.py"
Task: "Backend test for language filter in backend/podcasts/tests/test_api.py"
Task: "Backend test for GET /api/languages/ in backend/podcasts/tests/test_api.py"
Task: "Backend test for search+language combined filter in backend/podcasts/tests/test_api.py"

# Launch all foundational implementation together (after tests written):
Task: "Add PodcastLanguageSerializer in backend/podcasts/serializers.py"
Task: "Update PodcastListSerializer language field in backend/podcasts/serializers.py"
Task: "Update PodcastDetailSerializer language field in backend/podcasts/serializers.py"
Task: "Add PodcastPagination in backend/podcasts/views.py"
Task: "Add DjangoFilterBackend in backend/podcasts/views.py"
Task: "Add PodcastLanguageViewSet in backend/podcasts/views.py"
Task: "Register language endpoint in backend/podcasts/urls.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only — both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (podcast listing page)
4. Complete Phase 4: User Story 2 (search)
5. **STOP and VALIDATE**: Test browsing + searching independently
6. Deploy/demo if ready — this is a working podcast listing with search

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (browse) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (search) → Test independently → Deploy/Demo
4. Add US3 (pagination) → Test independently → Deploy/Demo
5. Add US4 (language filter) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational completes:

1. Developer A: User Story 1 (Phase 3) — builds PodcastList + PodcastCard
2. Once US1 complete:
   - Developer A: User Story 2 (Phase 4) — search
   - Developer B: User Story 3 (Phase 5) — pagination
   - Developer C: User Story 4 (Phase 6) — language filter
3. All integrate into the same PodcastList component with independent sub-components

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per Constitution III)
- Commit after each task or logical group per Conventional Commits format (Constitution V)
- Stop at any checkpoint to validate story independently
- Backend test runner: `docker compose exec backend uv run pytest backend/podcasts/tests/ -v`
- Frontend test runner: `npm test -- --run` (from `frontend/`)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
