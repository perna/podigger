/**
 * T052 — StoreHydration boundary component.
 *
 * Gates the first paint until both the auth and theme slices have
 * finished rehydrating from localStorage. The boundary is transparent
 * to keyboard and screen-reader users (no focus trap, no extra
 * role="status" announcement).
 */

"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { useAuthStore } from "./slices/auth";
import { useThemeStore, attachSystemThemeListener, syncInitialTheme } from "./slices/theme";

interface StoreHydrationProps {
  children: ReactNode;
}

const subscribe = () => () => undefined;
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function StoreHydration({ children }: StoreHydrationProps) {
  const authHydrated = useAuthStore((s) => s._hasHydrated);
  const themeHydrated = useThemeStore((s) => s._hasHydrated);
  const hasMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    syncInitialTheme();
    const detach = attachSystemThemeListener();
    return detach;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === "podigger.auth.v1") {
        useAuthStore.persist.rehydrate();
      }
      if (event.key === "podigger.theme.v1") {
        useThemeStore.persist.rehydrate();
        syncInitialTheme();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!hasMounted || !authHydrated || !themeHydrated) {
    return null;
  }
  return <>{children}</>;
}
