/**
 * T018 (004 T125) — PodcastList behavioural test.
 *
 * Exercises the success / loading / error / retry / pagination paths
 * through the component's `podcastsService.list` contract, importing
 * from the feature folder (never from `@/components/`).
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { PodcastList } from "../ui/PodcastList";
import { podcastsService } from "@/shared/api/endpoints/podcasts";
import type { Podcast } from "@/shared/api/endpoints/podcasts";

vi.mock("@/lib/useDebounce", () => ({
  useDebounce: <T,>(value: T) => value,
}));

vi.mock("../ui/LanguageFilter", () => ({
  LanguageFilter: () => <div data-testid="language-filter" />,
}));

const podcast = { id: 1, name: "podcast one", image: null, language: null } as unknown as Podcast;

describe("PodcastList (004 T125)", () => {
  beforeEach(() => {
    vi.spyOn(podcastsService, "list").mockReset();
    Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows skeletons while the request is in flight", () => {
    vi.spyOn(podcastsService, "list").mockReturnValue(new Promise(() => {}));
    render(<PodcastList />);
    expect(screen.getAllByLabelText(/loading content/i).length).toBeGreaterThan(0);
  });

  it("renders the podcasts on success", async () => {
    vi.spyOn(podcastsService, "list").mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [podcast],
    });
    render(<PodcastList />);
    expect(await screen.findByText("podcast one")).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", async () => {
    const listSpy = vi
      .spyOn(podcastsService, "list")
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue({
        count: 1,
        next: null,
        previous: null,
        results: [podcast],
      });
    render(<PodcastList />);
    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("podcast one")).toBeInTheDocument();
  });

  it("paginates via the Próximo button", async () => {
    const listSpy = vi.spyOn(podcastsService, "list").mockResolvedValue({
      count: 40,
      next: "http://x/?page=2",
      previous: null,
      results: [podcast],
    });
    render(<PodcastList />);
    fireEvent.click(await screen.findByRole("button", { name: /próxima página/i }));
    await waitFor(() =>
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
  });

  it("shows the empty state when there are no podcasts", async () => {
    vi.spyOn(podcastsService, "list").mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    render(<PodcastList />);
    expect(await screen.findByText(/nenhum podcast encontrado/i)).toBeInTheDocument();
  });
});
