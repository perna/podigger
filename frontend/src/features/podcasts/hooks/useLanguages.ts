/**
 * T041 — useLanguages.
 *
 * Gated on the auth slice being hydrated (avoids the bootstrap race
 * where the languages query fires before the auth slice has been
 * rehydrated from localStorage).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { languagesQueries, languagesService } from "@/shared/api/endpoints/languages";
import { useAuthStore } from "@/shared/store/slices/auth";

export function useLanguages() {
  const authHydrated = useAuthStore((s) => s._hasHydrated);
  const query = useQuery({
    queryKey: languagesQueries.list(),
    queryFn: ({ signal }) => languagesService.list(),
    enabled: authHydrated,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
