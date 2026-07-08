/**
 * T024 — TanStack Query client with the application defaults.
 *
 * @see research.md §1
 * @see specs/004-frontend-modernization/decisions.md §AD-001 — staleTime
 */

import { QueryClient } from "@tanstack/react-query";
import { env } from "@/shared/env";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Spec edge case "Stale data after a long session" — cache is
        // considered stale after 30 min of inactivity and the next
        // visit revalidates in the background.
        staleTime: 30 * 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          const status =
            error && typeof error === "object" && "status" in error
              ? (error as { status?: number | null }).status
              : null;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });
}

export const QUERY_DEFAULTS = {
  pageSize: env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE,
} as const;
