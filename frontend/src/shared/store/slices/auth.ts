/**
 * T049 — Auth slice (US2 / Slice 5).
 *
 * Cross-cutting state for the signed-in user. Persisted to localStorage
 * under `podigger.auth.v1`. Cross-tab sync via the `storage` event.
 *
 * @see data-model.md §1
 */

import { create, type StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";
import { env } from "@/shared/env";

export type User = {
  email: string;
  role: "admin" | "editor" | "reader";
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  _hasHydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setStatus: (status: AuthStatus) => void;
  setHasHydrated: (value: boolean) => void;
}

export const userSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "reader"]),
});

const persistedSchema = z.object({
  user: userSchema.nullable(),
  status: z.enum(["idle", "loading", "authenticated", "unauthenticated"]),
});

const authSlice: StateCreator<AuthState> = (set) => ({
  user: null,
  status: "idle",
  _hasHydrated: false,
  login: (user) => set({ user, status: "authenticated" }),
  logout: () => set({ user: null, status: "unauthenticated" }),
  setStatus: (status) => set({ status }),
  setHasHydrated: (value) => set({ _hasHydrated: value }),
});

export const useAuthStore = create<AuthState>()(
  persist(authSlice, {
    name: "podigger.auth.v1",
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
    partialize: (state) => ({ user: state.user, status: state.status }),
    merge: (persisted, current) => {
      const parsed = persistedSchema.safeParse(persisted);
      if (!parsed.success) {
        if (env.NODE_ENV !== "production") {
          console.warn("[auth] malformed persisted blob; using defaults", parsed.error.issues);
        }
        return current;
      }
      return { ...current, user: parsed.data.user, status: parsed.data.status };
    },
    onRehydrateStorage: () => (state) => {
      state?.setHasHydrated(true);
    },
  }),
);

export const useAuth = () => useAuthStore((s) => s);
