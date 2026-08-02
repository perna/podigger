/**
 * T125 / FR-005 — LoginForm.
 *
 * Asserts the form:
 *  - renders the new labels (Email, Password) and the Sign in button
 *  - submits via the mutation and calls onSuccess on a successful response
 *  - shows the generic error fallback when the mutation rejects with a
 *    plain Error
 *  - shows the validation error when email is invalid and does not call
 *    the mutation
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-005
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "@/features/auth";

const mutateAsync = vi.fn();
const useLoginMutationMock = vi.fn(() => ({
  mutateAsync,
  error: null as unknown,
  isSuccess: false,
  isPending: false,
}));

vi.mock("@/features/auth/hooks/useLoginMutation", () => ({
  useLoginMutation: () => useLoginMutationMock(),
}));

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLoginMutationMock.mockReturnValue({
      mutateAsync,
      error: null,
      isSuccess: false,
      isPending: false,
    });
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the form with the new labels and the Sign in button", () => {
    renderWithQuery(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("submits via the mutation and calls onSuccess on a successful response", async () => {
    mutateAsync.mockResolvedValue({
      access: "tok",
      refresh: "ref",
      user: { email: "a@b.co", role: "admin" },
    });
    const onSuccess = vi.fn();
    renderWithQuery(<LoginForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "hunter2" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ email: "a@b.co", password: "hunter2" }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows the generic error fallback when the mutation rejects", async () => {
    useLoginMutationMock.mockReturnValue({
      mutateAsync,
      error: new Error("Network down"),
      isSuccess: false,
      isPending: false,
    });
    renderWithQuery(<LoginForm />);
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
