/**
 * T034 / FR-001 — usePodcastsFeed placeholderData.
 *
 * Asserts that placeholderData: keepPreviousData is honoured across
 * filter changes — the previous data stays on screen until the new
 * data resolves (no skeleton flash).
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.6
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePodcastsFeed } from "@/features/podcasts";
import { podcastsService } from "@/shared/api/endpoints/podcasts";

function UsePodcastsFeedProbe({ language }: { language: number | null }) {
  const { data } = usePodcastsFeed({ language });
  return (
    <ul>
      {(data?.results ?? []).map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("usePodcastsFeed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("placeholderData: keepPreviousData keeps the previous list across filter changes", async () => {
    const first = deferred<{ count: number; next: string | null; previous: string | null; results: Array<{ id: number; name: string; total_episodes: number }> }>();
    const second = deferred<{ count: number; next: string | null; previous: string | null; results: Array<{ id: number; name: string; total_episodes: number }> }>();
    const listSpy = vi
      .spyOn(podcastsService, "list")
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <UsePodcastsFeedProbe language={null} />
      </QueryClientProvider>,
    );

    // Resolve the first request with 5 podcasts.
    await act(async () => {
      first.resolve({
        count: 5,
        next: null,
        previous: null,
        results: [
          { id: 1, name: "podcast 1", total_episodes: 0 },
          { id: 2, name: "podcast 2", total_episodes: 0 },
          { id: 3, name: "podcast 3", total_episodes: 0 },
          { id: 4, name: "podcast 4", total_episodes: 0 },
          { id: 5, name: "podcast 5", total_episodes: 0 },
        ],
      });
    });
    await waitFor(() => expect(screen.getByText("podcast 1")).toBeInTheDocument());

    // Re-render with a new language filter — the second request is
    // pending, but the previous data should stay on screen (no flash).
    rerender(
      <QueryClientProvider client={queryClient}>
        <UsePodcastsFeedProbe language={1} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("podcast 1")).toBeInTheDocument();

    // Resolve the second request with different podcasts.
    await act(async () => {
      second.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 99, name: "podcast filtered", total_episodes: 0 }],
      });
    });
    await waitFor(() => expect(screen.getByText("podcast filtered")).toBeInTheDocument());

    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
