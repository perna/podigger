/**
 * T042 — useHomeSearch.
 *
 * Combines the debounce (useDebounce) and the cancellation logic for
 * rapid successive queries. The feed hook itself shares in-flight
 * requests via the query key, so two simultaneous mounts dedupe; this
 * hook is the per-mount debouncer that fires the new query.
 */

"use client";

import { useDebounce } from "@/shared/hooks";
import { useEpisodesFeed } from "@/features/episodes";

export interface UseHomeSearchOptions {
  query: string;
  debounceMs?: number;
}

export function useHomeSearch({ query, debounceMs = 300 }: UseHomeSearchOptions) {
  const debounced = useDebounce(query, debounceMs);
  return useEpisodesFeed({ search: debounced });
}
