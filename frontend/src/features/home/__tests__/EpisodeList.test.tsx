/**
 * T018 (004 T124) — EpisodeList behavioural test.
 *
 * Exercises the success / loading / error / retry paths through the
 * component's `episodesService.list` contract, importing from the
 * feature folder (never from `@/components/`).
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { EpisodeList } from "../ui/EpisodeList";
import { episodesService } from "@/shared/api/endpoints/episodes";
import type { Episode } from "@/shared/api/endpoints/episodes";

vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

vi.mock("@/features/episodes", () => ({
  EpisodeCardCompact: ({ episode }: { episode: Episode }) => (
    <div data-testid="episode-compact">{episode.title}</div>
  ),
}));

vi.mock("@/features/home", async () => {
  const actual = await vi.importActual<typeof import("@/features/home")>("@/features/home");
  return {
    ...actual,
    EpisodeCard: ({ episode }: { episode: Episode }) => (
      <div data-testid="episode-card">{episode.title}</div>
    ),
  };
});

const episode = { id: 1, title: "episode one" } as unknown as Episode;

describe("EpisodeList (004 T124)", () => {
  beforeEach(() => {
    vi.spyOn(episodesService, "list").mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the loading state while the request is in flight", () => {
    vi.spyOn(episodesService, "list").mockReturnValue(new Promise(() => {}));
    const { container } = render(<EpisodeList searchTerm="" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the episodes on success", async () => {
    vi.spyOn(episodesService, "list").mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [episode],
    });
    render(<EpisodeList searchTerm="" />);
    expect(await screen.findAllByText("episode one")).not.toHaveLength(0);
  });

  it("shows the error state and retries on demand", async () => {
    const listSpy = vi
      .spyOn(episodesService, "list")
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue({
        count: 1,
        next: null,
        previous: null,
        results: [episode],
      });
    render(<EpisodeList searchTerm="" />);
    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText("episode one")).not.toHaveLength(0);
  });

  it("shows the empty state when there are no episodes", async () => {
    vi.spyOn(episodesService, "list").mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    render(<EpisodeList searchTerm="" />);
    expect(await screen.findByText(/no episodes found yet/i)).toBeInTheDocument();
  });
});
