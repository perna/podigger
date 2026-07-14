/**
 * T035 / FR-001 — useLanguages auth-hydration gate.
 *
 * Asserts the languages hook is enabled only when the auth slice is
 * hydrated (the bootstrap race fix).
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.7
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLanguages } from "@/features/podcasts";
import { languagesService } from "@/shared/api/endpoints/languages";
import { useAuthStore } from "@/shared/store/slices/auth";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useLanguages", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: "idle", _hasHydrated: false });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, status: "idle", _hasHydrated: false });
  });

  it("is disabled until the auth slice is hydrated (no fetch fires)", async () => {
    const listSpy = vi.spyOn(languagesService, "list").mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useLanguages(), { wrapper: wrapper(qc) });
    // Give the query a tick to potentially fire — it must not.
    await new Promise((r) => setTimeout(r, 20));
    expect(listSpy).not.toHaveBeenCalled();

    // Now hydrate the auth slice — the query becomes enabled and fires.
    useAuthStore.getState().setHasHydrated(true);
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(1));
  });
});
