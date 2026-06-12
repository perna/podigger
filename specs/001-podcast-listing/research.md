# Research Notes: Listagem de Podcasts

**Feature**: 001-podcast-listing
**Date**: 2026-06-11

## R1: Language Filter Strategy on Backend

**Decision**: Add `DjangoFilterBackend` to `PodcastViewSet` with `filterset_fields = ["language"]`.

**Rationale**:
- `EpisodeViewSet` already uses `DjangoFilterBackend` with `filterset_fields = ["podcast"]` — this is the established pattern in the codebase
- Adding `DjangoFilterBackend` allows filtering by `?language=<id>` which maps cleanly to the FK field
- The `django-filter` package is already installed (used by `EpisodeViewSet`)
- No custom filter logic needed — `DjangoFilterBackend` handles exact FK matching natively

**Alternatives considered**:
- Custom `filter_queryset` override: More code, no benefit over `DjangoFilterBackend` for an exact FK match
- Multiple query params (`?language_code=pt`): Requires custom field lookup, adds complexity with no clear UX benefit for the initial feature

## R2: Language Serialization (FK → nested object)

**Decision**: Add an explicit `language` field to both `PodcastListSerializer` and `PodcastDetailSerializer` that serializes the FK as `{id, code, name}` using a nested read-only approach.

**Rationale**:
- Currently `language` is serialized as a raw integer (the FK `id`), which is unusable for the frontend without a secondary lookup
- The frontend needs language name for display and language code for filtering
- `PodcastMinimalSerializer` pattern (nested object inside `EpisodeSerializer`) sets precedent for nested read-only serialization
- Creating a minimal `PodcastLanguageSerializer` avoids N+1 query issues with `select_related("language")` on the queryset

**Implementation**:
```python
class PodcastLanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PodcastLanguage
        fields = ["id", "code", "name"]
```
Then in `PodcastListSerializer`/`PodcastDetailSerializer`, override the `language` field as `PodcastLanguageSerializer(read_only=True)`.

**Alternatives considered**:
- `StringRelatedField`: Would return `"português (pt)"` (the `__str__`), but the frontend needs structured code+name
- `SlugRelatedField(slug_field="code")`: Returns only the code string, not the name, losing display info
- Keeping raw integer + adding a second endpoint: Requires extra frontend request, worse UX

## R3: Pagination Metadata Sufficiency

**Decision**: DRF's built-in `PageNumberPagination` is sufficient. Default `page_size` will be set to 20 per the spec requirements, overridden on `PodcastViewSet`.

**Rationale**:
- DRF's `PageNumberPagination` already returns `count`, `next`, `previous`, `results` in the paginated response
- The `PodcastsResponse` interface in `api.ts` already expects these fields
- Setting `PAGE_SIZE=20` on the viewset overrides the global default (10) without changing other endpoints

**Implementation**: Add `pagination_class = PodcastPagination` to `PodcastViewSet` where `PodcastPagination(PageNumberPagination)` has `page_size = 20` and `page_size_query_param = "page_size"` to allow the frontend to customize it.

**Alternatives considered**:
- Custom pagination class with additional metadata: Unnecessary; DRF's standard pagination already meets all FR-004 requirements
- Changing global PAGE_SIZE: Would affect episodes and other endpoints, undesirable

## R4: Language Endpoint for Filter Dropdown

**Decision**: Add a read-only `PodcastLanguageViewSet` at `/api/languages/` to serve the list of available languages for the filter dropdown.

**Rationale**:
- The frontend needs a list of available languages to populate the filter dropdown
- A dedicated endpoint avoids hardcoding language options on the frontend
- Read-only `ReadOnlyModelViewSet` is the simplest approach
- Cached/browser-cached since language lists rarely change

**Implementation**:
```python
class PodcastLanguageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PodcastLanguage.objects.all().order_by("name")
    serializer_class = PodcastLanguageSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # All languages in one response
```

**Alternatives considered**:
- Adding `?available_languages` to podcast list response: Mixes concerns, violates single-responsibility
- Hardcoding languages on frontend: Brittle, doesn't adapt to database changes
- Filtering by distinct language IDs from current podcasts: Requires a custom query and may miss languages with zero podcasts

## R5: Frontend Search Debounce Strategy

**Decision**: Implement debounce on the search input using a custom `useDebounce` hook (300ms delay). The search query is sent as `?search=<term>` to the existing `fetchPodcasts` function.

**Rationale**:
- 300ms debounce prevents excessive API calls while feeling responsive
- Simple `useDebounce` hook (already a common React pattern) avoids adding external dependencies
- The existing `fetchPodcasts(query, page)` function already supports `?search=` parameter — no API changes needed for search

**Alternatives considered**:
- `lodash/debounce`: Adds a dependency for a simple hook
- Server-side search (form submit): Full page reload, worse UX
- `useTransition`: Next.js-specific, adds complexity for a simple debounce

## R6: Pagination Component Architecture

**Decision**: Build a reusable `Pagination` component that receives `currentPage`, `totalPages`, `hasNext`, `hasPrevious` and `onPageChange` callback.

**Rationale**:
- Keeps pagination logic decoupled from the podcast list component
- Can be reused for future episode pagination if needed
- Simple "Anterior" / "Próximo" controls match the spec's acceptance scenarios
- The component is pure UI — all state management stays in the parent `PodcastList`

**Implementation**: Show "Anterior" button (disabled on page 1), current page indicator (e.g., "Page 2 of 5"), "Próximo" button (disabled on last page or when `next === null`).

**Alternatives considered**:
- Embedding pagination in `PodcastList`: Less reusable, harder to test in isolation
- Numbered page buttons: KISS principle — Anterior/Próximo is simpler and sufficient per spec

## R7: PodcastList Component Architecture

**Decision**: Build a `"use client"` component (`PodcastListClient`) that holds all local state (search, language, page) and orchestrates API calls. The `/podcasts` page is a minimal server component wrapper.

**Rationale**:
- Follows the established `HomeClient` pattern (server page → client component)
- Search+filter+pagination are inherently interactive — must be client-side
- State lives in one place: `PodcastListClient` owns the search term, selected language, and current page
- Loading/error/empty states handled uniformly at the component level

**Implementation**:
```
src/app/podcasts/page.tsx          → Server component (<PodcastListClient />)
src/components/podcasts/PodcastList.tsx → Client component (state + orchestration)
src/components/podcasts/PodcastCard.tsx → (existing, modified to show language name)
src/components/podcasts/LanguageFilter.tsx → Language dropdown
src/components/podcasts/Pagination.tsx → Page navigation
```

**Alternatives considered**:
- Server component with URL search params: More complex state management via URL, less responsive UX for debounced search
- Separate search page vs browse page: Unnecessary split for this feature scope

## R8: Podcast Interface Update (Frontend)

**Decision**: Update the `Podcast` TypeScript interface in `api.ts` to change `language` from `number | null` to `{ id: number; code: string; name: string } | null`.

**Rationale**:
- The backend will now serialize `language` as a nested object instead of a raw FK ID
- This is a contract change that must be coordinated between backend and frontend
- The existing `PodcastCard` component already receives `podcast.language` but doesn't display it — this change enables language display

**Alternatives considered**:
- Keeping `language: number | null` and adding a separate `languageName` field: Worse API design, inconsistent with nested relationship patterns (`episode.podcast` already uses this pattern)
