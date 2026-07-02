/**
 * T051 — Store index.
 *
 * Re-exports the auth and theme slices plus the devtools-wrapped
 * `useStore` hook and a hydration selector.
 */

import { useAuthStore } from "./slices/auth";
import { useThemeStore } from "./slices/theme";

export { useAuth, useAuthStore, type AuthState, type User } from "./slices/auth";
export {
  useTheme,
  useThemeStore,
  type ThemeState,
  type ThemeMode,
  attachSystemThemeListener,
  syncInitialTheme,
} from "./slices/theme";

export function useStoreHydrated(): boolean {
  const authHydrated = useAuthStore((s) => s._hasHydrated);
  const themeHydrated = useThemeStore((s) => s._hasHydrated);
  return authHydrated && themeHydrated;
}

export { createQueryClient } from "@/shared/api";
