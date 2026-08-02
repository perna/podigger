/**
 * T126 / FR-005 — RegisterForm.
 *
 * Asserts the form:
 *  - renders the new labels (Email, Password) and the Create account button
 *  - submits via the mutation and calls onSuccess on a successful response
 *  - shows the validation error when password is too short and does not
 *    call the mutation
 *  - shows the generic error fallback when the mutation rejects
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-005
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegisterForm } from "@/features/auth";

const mutateAsync = vi.fn();
const useRegisterMutationMock = vi.fn(() => ({
  mutateAsync,
  error: null as unknown,
  isSuccess: false,
  isPending: false,
}));

vi.mock("@/features/auth/hooks/useRegisterMutation", () => ({
  useRegisterMutation: () => useRegisterMutationMock(),
}));

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRegisterMutationMock.mockReturnValue({
      mutateAsync,
      error: null,
      isSuccess: false,
      isPending: false,
    });
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the form with the new labels and the Create account button", () => {
    renderWithQuery(<RegisterForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("submits via the mutation and calls onSuccess on a successful response", async () => {
    mutateAsync.mockResolvedValue({ user: { email: "a@b.co", role: "reader" } });
    const onSuccess = vi.fn();
    renderWithQuery(<RegisterForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "longenough" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ email: "a@b.co", password: "longenough" }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows the password-length validation error and does not call the mutation", async () => {
    renderWithQuery(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("shows the generic error fallback when the mutation rejects", async () => {
    useRegisterMutationMock.mockReturnValue({
      mutateAsync,
      error: new Error("Network down"),
      isSuccess: false,
      isPending: false,
    });
    renderWithQuery(<RegisterForm />);
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
