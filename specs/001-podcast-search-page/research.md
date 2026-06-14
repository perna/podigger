# Research: Página de Busca de Podcasts

## R1: Pagination Pattern — Traditional vs Infinite Scroll

**Decision**: Use traditional page-based pagination (page numbers) instead of infinite scroll.

**Rationale**:
- Spec FR-005 explicitly requires "controles de paginação" (pagination controls) with
  forward/backward navigation.
- Tab switching resets pagination to page 1 (US3, scenario 2), which is simpler with
  explicit page state.
- URL-based sharing (`/search?q=termo&page=2`) is a spec requirement (FR-010) — page
  numbers map cleanly to URL query params.
- Infinite scroll (used by `EpisodeList.tsx` and `PodcastsPage.tsx`) is better for
  discovery/exploration flows; pagination is better for targeted search where users
  may want to return to a specific result position.

**Alternatives considered**:
- Infinite scroll: Abandoned because it conflicts with FR-005 (pagination controls)
  and makes URL-based state sharing harder.
- Hybrid (load-more button): Abandoned because page numbers are more precise for
  "return to page N" use cases.

## R2: Simultaneous API Calls Strategy

**Decision**: Fire podcast search and episode search in parallel using `Promise.allSettled`.

**Rationale**:
- Both searches are independent — neither depends on the other's result.
- The "Todos" (All) tab shows both result types simultaneously (FR-002).
- `allSettled` (vs `all`) ensures one failed call doesn't block the other from rendering.
- Already have typed functions `fetchPodcasts(q)` and `fetchEpisodes(q)` in `lib/api.ts`.

**Alternatives considered**:
- Sequential calls: Rejected — doubles perceived latency for the "Todos" tab.
- Single unified backend endpoint: Rejected — would require backend changes (new
  endpoint/serializer) with no clear benefit; existing endpoints are well-tested.

## R3: URL State Synchronization

**Decision**: Use Next.js `useSearchParams` + `useRouter` for bidirectional URL sync.

**Rationale**:
- Spec FR-010: "preservar o termo de busca e o estado da interface na URL (`/search?q=&tab=&page=`)".
- URL state must be the source of truth for: query term (`q`), active tab (`tab`),
  and current page (`page`). Page resets to 1 on tab change per FR-010.
- `useSearchParams` (read) + `router.replace` (write, shallow) keeps URL in sync
  without full page navigation.
- Initial page load reads `?q=` from URL and auto-triggers search (US3 scenario 3,
  FR-010).

**Alternatives considered**:
- React state only: Rejected — breaks URL sharing and browser back/forward navigation.
- Next.js dynamic route segments: Rejected — query params are simpler for optional
  parameters and avoid deep route nesting.

**URL scheme**: `/search?q=<termo>&tab=<todos|podcasts|episodios>&page=<n>`

## R4: PopularTerm API Integration

**Decision**: Add `fetchPopularTerms()` to `lib/api.ts` consuming the existing
`/api/popular-terms/` endpoint.

**Rationale**:
- Backend already has `PopularTermViewSet` returning `[{term, times}, ...]` ordered
  by `-times`.
- No new backend code needed — read-only public endpoint with `AllowAny` permission.
- Top 8 terms (per FR-006) are displayed as clickable chips.

**Alternatives considered**:
- Fetch on-demand: Rejected — popular terms are always displayed on initial page load
  (US4), so eager fetch is simpler.
- Static/server-rendered: Rejected — term popularity changes in real-time as users
  search.

## R5: Rapid Search Submission Handling

**Decision**: Use request abort + loading state lock (no explicit debounce).

**Rationale**:
- Spec FR-011: Enter key triggers search immediately — debouncing adds perceived
  latency for intentional submissions.
- For rapid submissions (edge case), abort previous in-flight requests via
  `AbortController` and only render the latest result.
- Loading state (`isSearching`) prevents UI flicker from intermediate aborted requests.

**Alternatives considered**:
- Debounce: Rejected — adds 300-500ms delay that contradicts the "instant search"
  expectation set by the Enter key interaction.
- Throttle: Rejected — doesn't prevent the last submission from being processed,
  but AbortController handles this more cleanly.

## R6: Error Handling Strategy

**Decision**: Per-call error states (not global) with retry per section.

**Rationale**:
- Podcast and episode searches are independent — one failing shouldn't hide the other's results.
- Error state shows an inline error message within the affected tab's content area,
  with a "Tentar novamente" (retry) button (FR-012).
- Network errors from individual requests are caught and surfaced independently.
- The overall page never enters a fully broken state.

**Alternatives considered**:
- Global error boundary: Rejected — too coarse; hides successful results when only
  one call fails.
- Toast notifications: Rejected — less persistent; retry action is clearer inline.
