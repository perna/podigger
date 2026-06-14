# Tasks: Página de Busca de Podcasts

**Input**: Design documents from `/specs/001-podcast-search-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per Constitution II (NON-NEGOTIABLE test coverage). All new frontend components require vitest unit tests. SearchPageClient requires integration test.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for source, `frontend/tests/` for tests
- **Backend**: `backend/` (no changes in this feature)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared dependency extension

- [x] T001 [P] Create route directory `frontend/src/app/search/` and component directory `frontend/src/components/search/`
- [x] T002 [P] Add `fetchPopularTerms()` function to `frontend/src/lib/api.ts` consuming `GET /api/popular-terms/` endpoint, ordered by `-times`, capped at 8 terms

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Define TypeScript types for search API responses (PodcastsResponse, EpisodesResponse, PopularTerm) and URL state params (q, tab, page) in `frontend/src/lib/api.ts`
- [x] T004 Create server component `frontend/src/app/search/page.tsx` — thin wrapper that renders SearchPageClient (placeholder client initially, replaced when T008 completes)

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Buscar podcasts e episódios por termo (Priority: P1)

**Goal**: User accesses `/search`, types a term, submits, and sees podcasts and episodes grouped by type with loading, empty, and error states. URL syncs with `?q=`.

**Independent Test**: Access `/search`, type "python", press Enter, see podcast and episode results grouped, URL becomes `/search?q=python`

### Implementation for User Story 1

- [x] T005 [P] [US1] Create SearchInput component with input field, submit button, min 2-character validation, disabled button for < 2 chars, Enter key handler in `frontend/src/components/search/SearchInput.tsx`
- [x] T006 [P] [US1] Create PodcastResults component rendering a list of PodcastCards from API response in `frontend/src/components/search/PodcastResults.tsx`
- [x] T007 [P] [US1] Create EpisodeResults component rendering a list of EpisodeCards from API response in `frontend/src/components/search/EpisodeResults.tsx`
- [x] T008 [US1] Create SearchPageClient component in `frontend/src/app/search/SearchPageClient.tsx` integrating SearchInput + PodcastResults + EpisodeResults with: dual parallel API calls via `Promise.allSettled`, AbortController for request cancellation, URL state sync via `useSearchParams` + `useRouter`, loading spinner, empty results message, and per-section error state with retry button
- [x] T009 [US1] Update `frontend/src/app/search/page.tsx` to render SearchPageClient with Suspense boundary

### Unit Tests for User Story 1

- [x] T010 [P] [US1] Create unit tests for SearchInput component (validation min 2 chars, disabled state, Enter key handler) in `frontend/tests/components/search/SearchInput.test.tsx`
- [x] T011 [P] [US1] Create unit tests for PodcastResults component (renders results, empty state, loading state) in `frontend/tests/components/search/PodcastResults.test.tsx`
- [x] T012 [P] [US1] Create unit tests for EpisodeResults component (renders results, empty state, loading state) in `frontend/tests/components/search/EpisodeResults.test.tsx`
- [x] T013 [US1] Create integration test for SearchPageClient (basic search, empty search shows recent, no-results message, loading indicator, error state with retry) in `frontend/tests/app/search/SearchPageClient.test.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional — search, display results, loading/empty/error states, URL sync

---

## Phase 4: User Story 2 - Filtrar resultados por tipo (Priority: P2)

**Goal**: After searching, user can switch between "Todos", "Podcasts", "Episodios" tabs. Tab change filters displayed results without new API calls. Tab without results shows type-specific empty message.

**Independent Test**: Search "python", click "Episodios" tab, verify only episodes show; click "Podcasts", verify only podcasts show; "Todos" shows both

### Implementation for User Story 2

- [x] T014 [P] [US2] Create FilterTabs component with three tabs (Todos/Podcasts/Episodios), active tab highlight, and `onTabChange` callback in `frontend/src/components/search/FilterTabs.tsx`
- [x] T015 [US2] Integrate FilterTabs into SearchPageClient: add `activeTab` state, `?tab=` URL sync, filter displayed results by current tab, show type-specific empty messages, reset `?page=` to 1 on tab change in `frontend/src/app/search/SearchPageClient.tsx`

### Unit Tests for User Story 2

- [x] T016 [P] [US2] Create unit tests for FilterTabs component (renders three tabs, active state, click fires callback) in `frontend/tests/components/search/FilterTabs.test.tsx`
- [x] T017 [US2] Add tab filtering scenarios to integration test in `frontend/tests/app/search/SearchPageClient.test.tsx` (tab filtering, tab-specific empty messages, tab URL sync, page reset on tab change)

**Checkpoint**: User Stories 1 AND 2 both work independently. Tab filtering fully functional with URL state.

---

## Phase 5: User Story 3 - Navegar por páginas de resultados (Priority: P3)

**Goal**: When results exceed 10 items, pagination controls appear. User can navigate forward/backward. Page changes sync to URL. Page resets on tab switch. Page scrolls to top on navigation.

**Independent Test**: Search common term with >10 results, verify pagination appears, click "Próxima" → page 2 loads, URL updates, "Anterior" appears

### Implementation for User Story 3

- [x] T018 [P] [US3] Create SearchPagination component with Previous/Next buttons, current page indicator, disabled states for first/last page, hide when results <= 10 in `frontend/src/components/search/SearchPagination.tsx`
- [x] T019 [US3] Integrate SearchPagination into SearchPageClient: add `page` state, `?page=` URL sync, page change fires new API call, scroll-to-top on page change, pagination hidden when count <= 10 in `frontend/src/app/search/SearchPageClient.tsx`

### Unit Tests for User Story 3

- [x] T020 [P] [US3] Create unit tests for SearchPagination component (renders controls when count > 10, hidden when <= 10, disabled states, page indicators) in `frontend/tests/components/search/SearchPagination.test.tsx`
- [x] T021 [US3] Add pagination scenarios to integration test in `frontend/tests/app/search/SearchPageClient.test.tsx` (pagination appears >10, page navigation, URL sync, page reset on tab switch, scroll-to-top)

**Checkpoint**: User Stories 1, 2, AND 3 all work independently. Full pagination functional.

---

## Phase 6: User Story 4 - Ver termos populares como sugestão (Priority: P3)

**Goal**: When search input is empty, popular terms appear as clickable chips. Clicking a chip fills the input and executes search. Section hidden when no data or query present.

**Independent Test**: Access `/search` empty, verify popular terms chips appear, click one → search executed automatically

### Implementation for User Story 4

- [x] T022 [P] [US4] Create PopularTerms component fetching top 8 terms from API, rendering as clickable chips, hidden when terms unavailable or empty in `frontend/src/components/search/PopularTerms.tsx`
- [x] T023 [US4] Integrate PopularTerms into SearchPageClient: eager fetch on mount, display when `query` is empty, chip click fills input + triggers search, section hidden on empty data in `frontend/src/app/search/SearchPageClient.tsx`

### Unit Tests for User Story 4

- [x] T024 [P] [US4] Create unit tests for PopularTerms component (renders chips, click triggers callback, hidden when empty, handles API error gracefully) in `frontend/tests/components/search/PopularTerms.test.tsx`
- [x] T025 [US4] Add popular terms scenarios to integration test in `frontend/tests/app/search/SearchPageClient.test.tsx` (chips displayed when empty, hidden when query present, chip click → search, hidden when no data)

**Checkpoint**: All user stories now independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, quality gates, and final verification

- [x] T026 Run ESLint (`npm run lint`) on `frontend/` and fix any warnings
- [x] T027 Run TypeScript type check (`npx tsc --noEmit`) on `frontend/` and fix any errors
- [x] T028 Run vitest (`npm test`) on `frontend/` — all tests must pass
- [x] T029 Validate against quickstart.md scenarios VS-1 through VS-11

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US2 depends on US1 (FilterTabs integrates into existing SearchPageClient)
  - US3 depends on US1 (SearchPagination integrates into existing SearchPageClient)
  - US4 depends on US1 (PopularTerms integrates into existing SearchPageClient)
  - US2, US3, US4 can proceed in any order after US1
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 completion — Requires SearchPageClient to exist
- **User Story 3 (P3)**: Can start after US1 completion — Requires SearchPageClient to exist
- **User Story 4 (P3)**: Can start after US1 completion — Requires SearchPageClient to exist

### Within Each User Story

- Create components (marked [P]) before integrating into SearchPageClient
- Unit tests (marked [P]) can be written in parallel with component creation
- Integration test updates come after implementation tasks

### Parallel Opportunities

- T001 + T002 (Setup) can run in parallel
- T003 (types) can run in parallel with T004 (server component) after Setup
- T005, T006, T007 (US1 components) can run in parallel
- T010, T011, T012 (US1 component unit tests) can run in parallel
- T014 + T016 (US2 component + test) can run in parallel
- T018 + T020 (US3 component + test) can run in parallel
- T022 + T024 (US4 component + test) can run in parallel
- US2, US3, US4 can proceed in parallel after US1 is complete

---

## Parallel Example: User Story 1

```bash
# Launch all US1 components together:
Task: "T005 Create SearchInput in frontend/src/components/search/SearchInput.tsx"
Task: "T006 Create PodcastResults in frontend/src/components/search/PodcastResults.tsx"
Task: "T007 Create EpisodeResults in frontend/src/components/search/EpisodeResults.tsx"

# After T005-T007 complete, launch all US1 unit tests together:
Task: "T010 Test SearchInput in frontend/tests/components/search/SearchInput.test.tsx"
Task: "T011 Test PodcastResults in frontend/tests/components/search/PodcastResults.test.tsx"
Task: "T012 Test EpisodeResults in frontend/tests/components/search/EpisodeResults.test.tsx"

# While unit tests run, implement SearchPageClient:
Task: "T008 Create SearchPageClient in frontend/src/app/search/SearchPageClient.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (VS-1, VS-2, VS-3, VS-10, VS-11 from quickstart.md)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently (VS-4, VS-5) → Deploy/Demo
4. Add User Story 3 → Test independently (VS-6, VS-7) → Deploy/Demo
5. Add User Story 4 → Test independently (VS-8) → Final validation (VS-9, VS-11)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- No backend changes — all APIs already exist and tested
- Tests follow naming: `frontend/tests/components/search/<ComponentName>.test.tsx` for unit, `frontend/tests/app/search/SearchPageClient.test.tsx` for integration
- Test files must be created with the `frontend/tests/` directory structure matching source
- Each checkpoint is independently validatable via quickstart.md scenarios
- Commit after each task or logical group
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
