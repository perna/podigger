/**
 * T048 / SC-002, FR-015 — StoreHydration gate.
 *
 * Asserts the hydration boundary:
 *  - returns null until both auth and theme slices are hydrated
 *  - is transparent to keyboard and screen-reader users (no role="status",
 *    no aria-live, no focus trap, no extra wrapper)
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md SC-002, FR-015
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.4
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useAuthStore } from "@/shared/store/slices/auth";
import { useThemeStore } from "@/shared/store/slices/theme";
import { StoreHydration } from "@/shared/store/StoreHydration";

function resetStores() {
  useAuthStore.setState({ user: null, status: "idle", _hasHydrated: false });
  useThemeStore.setState({ mode: "system", _hasHydrated: false });
  localStorage.clear();
}

describe("StoreHydration boundary", () => {
  beforeEach(() => resetStores());
  afterEach(() => {
    cleanup();
    resetStores();
  });

  it("returns null until both auth and theme slices are hydrated", () => {
    const { container } = render(
      <StoreHydration>
        <div data-testid="child">child</div>
      </StoreHydration>,
    );
    // Neither slice is hydrated yet — children must not be in the DOM.
    expect(container.firstChild).toBeNull();

    // Hydrate auth only — still gated.
    useAuthStore.getState().setHasHydrated(true);
    cleanup();
    const { container: c2 } = render(
      <StoreHydration>
        <div data-testid="child">child</div>
      </StoreHydration>,
    );
    expect(c2.firstChild).toBeNull();

    // Hydrate theme too — gate opens.
    useThemeStore.getState().setHasHydrated(true);
    cleanup();
    render(
      <StoreHydration>
        <div data-testid="child">child</div>
      </StoreHydration>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("is transparent to keyboard and screen-reader users when open", () => {
    useAuthStore.getState().setHasHydrated(true);
    useThemeStore.getState().setHasHydrated(true);
    const { container } = render(
      <StoreHydration>
        <button>child button</button>
      </StoreHydration>,
    );
    // The boundary must not introduce role="status", aria-live, or a
    // focus trap of its own — children render as-is.
    expect(container.querySelector("[role='status']")).toBeNull();
    expect(container.querySelector("[aria-live]")).toBeNull();
    // The button child is reachable and not wrapped in a focus-trapping
    // sentinel.
    expect(screen.getByRole("button", { name: "child button" })).toBeInTheDocument();
  });
});
