/**
 * T046 / FR-002 — theme slice + matchMedia listener.
 *
 * Asserts the cross-cutting theme state:
 *  - setMode("dark") writes data-theme="dark" to documentElement
 *  - the slice reacts to matchMedia change events when in "system" mode
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-002
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.2
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachSystemThemeListener,
  useThemeStore,
  type ThemeMode,
} from "@/shared/store/slices/theme";

function resetTheme() {
  useThemeStore.setState({ mode: "system", _hasHydrated: false });
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
}

function mockMatchMedia(prefersDark: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    addListener: (cb: () => void) => listeners.add(cb),
    removeListener: (cb: () => void) => listeners.delete(cb),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = () => mql;
  return { mql, listeners };
}

describe("shared/store — theme slice", () => {
  beforeEach(() => resetTheme());
  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    resetTheme();
  });

  it("setMode('dark') writes data-theme='dark' to documentElement", () => {
    useThemeStore.getState().setMode("dark" as ThemeMode);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
  });

  it("setMode('light') writes data-theme='light' to documentElement", () => {
    useThemeStore.getState().setMode("light" as ThemeMode);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("reacts to matchMedia change events when in 'system' mode", () => {
    const { listeners } = mockMatchMedia(false);
    useThemeStore.getState().setMode("system");
    expect(document.documentElement.dataset.theme).toBe("light");
    const detach = attachSystemThemeListener();
    expect(listeners.size).toBe(1);
    listeners.forEach((cb) => cb());
    expect(useThemeStore.getState().mode).toBe("system");
    detach();
  });
});
