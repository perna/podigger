/**
 * T050 — Theme slice (US2 / Slice 6).
 */

import { create, type StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeState {
  mode: ThemeMode;
  _hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setHasHydrated: (value: boolean) => void;
}

const persistedSchema = z.object({
  mode: z.enum(["light", "dark", "system"]),
});

function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
}

const themeSlice: StateCreator<ThemeState> = (set) => ({
  mode: "system",
  _hasHydrated: false,
  setMode: (mode) => {
    applyThemeToDocument(mode);
    set({ mode });
  },
  setHasHydrated: (value) => set({ _hasHydrated: value }),
});

export const useThemeStore = create<ThemeState>()(
  persist(themeSlice, {
    name: "podigger.theme.v1",
    storage: createJSONStorage(() => {
      if (typeof window === "undefined") {
        return {
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
        };
      }
      return window.localStorage;
    }),
    partialize: (state) => ({ mode: state.mode }),
    merge: (persisted, current) => {
      const parsed = persistedSchema.safeParse(persisted);
      if (!parsed.success) {
        return current;
      }
      return { ...current, mode: parsed.data.mode };
    },
    onRehydrateStorage: () => (state) => {
      state?.setHasHydrated(true);
    },
  }),
);

export const useTheme = () => useThemeStore((s) => s);

export function attachSystemThemeListener(): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => undefined;
  }
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (useThemeStore.getState().mode === "system") {
      applyThemeToDocument("system");
    }
  };
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

export function syncInitialTheme(): void {
  if (typeof document === "undefined") return;
  applyThemeToDocument(useThemeStore.getState().mode);
}
