/**
 * T045 / FR-002 — auth slice transitions.
 *
 * Asserts the cross-cutting state for the signed-in user:
 *  - initial state is idle
 *  - login(user) transitions to authenticated
 *  - logout() transitions to unauthenticated
 *  - setHasHydrated round-trip is preserved
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-002
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.1
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAuthStore, type User } from "@/shared/store/slices/auth";

const INITIAL = { user: null, status: "idle" as const, _hasHydrated: false };

function resetAuth() {
  useAuthStore.setState(INITIAL);
  localStorage.clear();
}

describe("shared/store — auth slice", () => {
  beforeEach(() => resetAuth());
  afterEach(() => resetAuth());

  it("starts at idle with no user", () => {
    const { user, status, _hasHydrated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(status).toBe("idle");
    expect(_hasHydrated).toBe(false);
  });

  it("login(user) transitions to authenticated and stores the user", () => {
    const u: User = { email: "x@y.z", role: "admin" };
    useAuthStore.getState().login(u);
    const { user, status } = useAuthStore.getState();
    expect(status).toBe("authenticated");
    expect(user).toEqual(u);
  });

  it("logout() transitions to unauthenticated and clears the user", () => {
    useAuthStore.getState().login({ email: "x@y.z", role: "editor" });
    useAuthStore.getState().logout();
    const { user, status } = useAuthStore.getState();
    expect(status).toBe("unauthenticated");
    expect(user).toBeNull();
  });

  it("setHasHydrated(true) round-trips and is independent of login/logout", () => {
    useAuthStore.getState().setHasHydrated(true);
    expect(useAuthStore.getState()._hasHydrated).toBe(true);
    useAuthStore.getState().login({ email: "a@b.c", role: "reader" });
    expect(useAuthStore.getState()._hasHydrated).toBe(true);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState()._hasHydrated).toBe(true);
  });
});
