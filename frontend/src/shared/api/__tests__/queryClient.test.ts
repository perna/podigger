/**
 * QueryClient defaults test.
 *
 * Locks in the application-level TanStack Query defaults so a future
 * change to staleTime, gcTime, retry, or revalidation triggers a test
 * failure. The staleTime value comes from the spec edge case "Stale
 * data after a long session" (spec.md) — see
 * specs/004-frontend-modernization/decisions.md §AD-001.
 */

import { describe, it, expect } from "vitest";
import { createQueryClient } from "@/shared/api/queryClient";

describe("shared/api/queryClient", () => {
  it("applies the 30-minute staleTime from the spec edge case", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.staleTime).toBe(30 * 60_000);
  });

  it("applies the 5-minute gcTime", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.gcTime).toBe(5 * 60_000);
  });

  it("revalidates on window focus and reconnect", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.refetchOnWindowFocus).toBe(true);
    expect(defaults?.refetchOnReconnect).toBe(true);
  });

  it("does not retry on 4xx and retries at most twice on 5xx", () => {
    const client = createQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;
    expect(retry).toBeTypeOf("function");
    if (typeof retry !== "function") return;
    // 4xx: no retry
    expect(retry(0, { status: 404 } as unknown as Error)).toBe(false);
    expect(retry(0, { status: 422 } as unknown as Error)).toBe(false);
    // 5xx: retry up to 2
    expect(retry(0, { status: 500 } as unknown as Error)).toBe(true);
    expect(retry(1, { status: 500 } as unknown as Error)).toBe(true);
    expect(retry(2, { status: 500 } as unknown as Error)).toBe(false);
  });
});
