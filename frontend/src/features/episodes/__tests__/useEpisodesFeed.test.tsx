/**
 * T033 / FR-001, SC-001 — useEpisodesFeed dedup.
 *
 * Asserts that two simultaneous mounts of the hook share one in-flight
 * request (TanStack Query dedup). Spec contract: "All data fetching
 * for episodes goes through a single typed data layer with automatic
 * deduplication of identical in-flight requests" (FR-001).
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001, SC-001
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.5
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEpisodesFeed } from "@/features/episodes";
import { episodesService } from "@/shared/api/endpoints/episodes";

function UseEpisodesFeedProbe() {
  useEpisodesFeed();
  return null;
}

describe("useEpisodesFeed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("two simultaneous mounts share one in-flight request (dedup)", async () => {
    const listSpy = vi
      .spyOn(episodesService, "list")
      .mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <UseEpisodesFeedProbe />
        <UseEpisodesFeedProbe />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(1));
  });
});
