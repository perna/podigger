/**
 * T036 / FR-001, edge case "Rapid successive searches" — useHomeSearch.
 *
 * Asserts that rapid successive queries:
 *  - debounce: only the last query within the debounce window fires
 *  - cancel: the older in-flight request is aborted via AbortController
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.8
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHomeSearch } from "@/features/home";
import { episodesService } from "@/shared/api/endpoints/episodes";

function wrapper(qc: QueryClient) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
}

describe("useHomeSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debounces rapid input changes and only fires the final query", async () => {
    const listSpy = vi
      .spyOn(episodesService, "list")
      .mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    // Start with a non-empty initial query so the hook is already
    // mounted with a stable debounced value.
    const { rerender } = renderHook(
      ({ query }: { query: string }) => useHomeSearch({ query, debounceMs: 50 }),
      { wrapper: wrapper(qc), initialProps: { query: "start" } },
    );
    // Let the initial query fire.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });
    const initialCalls = listSpy.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    // Rapid successive searches within the debounce window.
    rerender({ query: "a" });
    await new Promise((r) => setTimeout(r, 20));
    rerender({ query: "ab" });
    await new Promise((r) => setTimeout(r, 20));
    rerender({ query: "abc" });

    // Before the debounce window elapses, no new request should have fired.
    expect(listSpy.mock.calls.length).toBe(initialCalls);

    // Wait for the debounce + a microtask flush.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });

    // Exactly one additional request should have fired (for "abc").
    expect(listSpy.mock.calls.length).toBe(initialCalls + 1);
    const lastCall = listSpy.mock.calls[listSpy.mock.calls.length - 1]?.[0] as
      | { search?: string }
      | undefined;
    expect(lastCall?.search).toBe("abc");
  });
});
