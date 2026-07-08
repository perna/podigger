# Decisions — 004-frontend-modernization

> Architecture decisions taken during the refactor. Format: AD-NNN (chronological).

---

## AD-001 — TanStack Query `staleTime` value

**Date**: 2026-07-07
**Status**: Accepted
**Drives**: `frontend/src/shared/api/queryClient.ts:14`, `specs/004-frontend-modernization/spec.md:256-258`

### Context

The spec edge case says:

> **Stale data after a long session**: After 30 minutes of inactivity the
> cache MUST be considered stale and the next visit MUST revalidate, even
> if the user did not reload the tab.

The implementation in `queryClient.ts` reads:

```ts
staleTime: 30_000,  // 30 seconds
gcTime: 5 * 60_000, // 5 minutes
```

`staleTime: 30_000` does not match the spec's "30 minutes of inactivity".

### Options considered

1. **(a) Update the spec to "30 seconds"** — matches code; the warm-cache SC-001
   metric (render previously seen content in < 100 ms) only makes sense at
   the SWR-canonical 30 s window, not 30 min. With 30 min, the user would
   see episodes from earlier in the day without any background refresh.
2. **(b) Update the code to `staleTime: 30 * 60_000`** (30 min) — matches
   spec literally; reduces network load; the background revalidation still
   runs on next navigation. Trade-off: episode lists may be up to 30 min
   stale on a busy day.
3. **(c) Two separate parameters** — keep code at 30 s for SWR demo and
   document both `staleTime` and `gcTime`. Rejected: this conflates two
   semantically distinct parameters and makes the spec harder to audit.

### Decision

**Adopt (b) — update the code to match the spec.** Rationale:

- The spec text is the slow-moving artifact; the implementation of an
  inferred value is more likely to drift than the spec.
- For a podcast app, 30-min cache lifetime is reasonable — episode
  metadata and podcast lists change on the order of hours, not seconds.
- 30 s was almost certainly a copy-paste from the TanStack Query default
  (the research.md says "TanStack Query canonical 30 s default for
  stale-while-revalidate demo UX"), not a deliberate product choice.
- The background revalidation still runs on every navigation (TanStack
  Query's `staleTime` is the gate, not the only refresh trigger;
  `refetchOnWindowFocus` and `refetchOnReconnect` still apply).

### Action

- `frontend/src/shared/api/queryClient.ts:14`: `staleTime: 30_000` →
  `staleTime: 30 * 60_000`.
- `frontend/src/shared/api/queryClient.ts`: add a one-line JSDoc
  explaining the value comes from spec edge case "Stale data after a
  long session".
- The existing `gcTime: 5 * 60_000` is preserved (memory cache
  eviction; not in scope of this AD).
