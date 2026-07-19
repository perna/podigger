/**
 * T124 / FR-009 — AddPodcastForm.
 *
 * Asserts the form:
 *  - renders the new labels and placeholders
 *  - submits via the mutation on valid input
 *  - shows the success message on a successful response
 *  - shows the server error message when the mutation rejects with a
 *    ServerError carrying an API message
 *  - shows a generic fallback when the mutation rejects with a plain Error
 *  - shows the validation error when name is empty and does NOT call the
 *    mutation
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-009
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.10
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddPodcastForm } from "@/features/add-podcast";
import { podcastsService, ServerError } from "@/shared/api";

const createSpy = vi.fn();
vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return {
    ...actual,
    podcastsService: {
      list: vi.fn(),
      create: (...args: unknown[]) => createSpy(...args),
    },
  };
});

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("AddPodcastForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the form with the new labels and placeholders", () => {
    renderWithQuery(<AddPodcastForm />);
    expect(screen.getByLabelText(/podcast name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rss feed url/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add podcast/i })).toBeInTheDocument();
  });

  it("submits via the mutation and shows the success message", async () => {
    createSpy.mockResolvedValue({ status: "created", message: "Podcast added successfully." });
    renderWithQuery(<AddPodcastForm />);
    fireEvent.change(screen.getByLabelText(/podcast name/i), { target: { value: "New" } });
    fireEvent.change(screen.getByLabelText(/rss feed url/i), {
      target: { value: "https://new.com/rss" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add podcast/i }));
    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({ name: "New", feed: "https://new.com/rss" }),
    );
    expect(await screen.findByText(/podcast added successfully/i)).toBeInTheDocument();
  });

  it("shows the server error message when the mutation rejects with a ServerError", async () => {
    createSpy.mockRejectedValue(
      new ServerError("Internal server error", {
        status: 500,
        details: { message: "Custom API error message" },
      }),
    );
    renderWithQuery(<AddPodcastForm />);
    fireEvent.change(screen.getByLabelText(/podcast name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/rss feed url/i), {
      target: { value: "https://test.com/rss" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add podcast/i }));
    expect(await screen.findByText(/custom api error message/i)).toBeInTheDocument();
  });

  it("shows a generic fallback when the mutation rejects with a plain Error", async () => {
    createSpy.mockRejectedValue(new Error("Network fail"));
    renderWithQuery(<AddPodcastForm />);
    fireEvent.change(screen.getByLabelText(/podcast name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/rss feed url/i), {
      target: { value: "https://test.com/rss" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add podcast/i }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("shows the validation error when name is empty and does not call the mutation", async () => {
    renderWithQuery(<AddPodcastForm />);
    fireEvent.click(screen.getByRole("button", { name: /add podcast/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
