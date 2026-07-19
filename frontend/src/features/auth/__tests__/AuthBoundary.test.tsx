/**
 * T127 / FR-005 — AuthBoundary.
 *
 * Asserts the boundary:
 *  - returns null until the auth slice is hydrated
 *  - returns children when the predicate passes (user present, predicate
 *    returns true)
 *  - renders the "Acesso Negado" fallback when the predicate fails
 *    (user null, or predicate returns false)
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-005
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { User } from "@/shared/store/slices/auth";

const useAuthMock = vi.fn();
vi.mock("@/shared/store/slices/auth", async () => {
  const actual = await vi.importActual<typeof import("@/shared/store/slices/auth")>(
    "@/shared/store/slices/auth",
  );
  return {
    ...actual,
    useAuth: () => useAuthMock(),
  };
});

// Import AFTER the mock is registered.
const { AuthBoundary } = await import("@/features/auth");

function setAuthState(opts: { user: User | null; _hasHydrated: boolean }) {
  useAuthMock.mockReturnValue({
    user: opts.user,
    status: opts.user ? "authenticated" : "unauthenticated",
    _hasHydrated: opts._hasHydrated,
    login: vi.fn(),
    logout: vi.fn(),
    setStatus: vi.fn(),
    setHasHydrated: vi.fn(),
  });
}

describe("AuthBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it("returns null until the auth slice is hydrated", () => {
    setAuthState({ user: { email: "a@b.co", role: "admin" }, _hasHydrated: false });
    const { container } = render(
      <AuthBoundary>
        <div data-testid="child">child</div>
      </AuthBoundary>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns children when the user is present and no predicate is given", () => {
    setAuthState({ user: { email: "a@b.co", role: "admin" }, _hasHydrated: true });
    render(
      <AuthBoundary>
        <div data-testid="child">child</div>
      </AuthBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders the Acesso Negado fallback when the user is null", () => {
    setAuthState({ user: null, _hasHydrated: true });
    render(
      <AuthBoundary>
        <div data-testid="child">child</div>
      </AuthBoundary>,
    );
    expect(screen.getByText(/acesso negado/i)).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders the Acesso Negado fallback when the predicate returns false", () => {
    setAuthState({ user: { email: "a@b.co", role: "reader" }, _hasHydrated: true });
    render(
      <AuthBoundary predicate={(u) => u?.role === "admin"}>
        <div data-testid="child">child</div>
      </AuthBoundary>,
    );
    expect(screen.getByText(/acesso negado/i)).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });
});
