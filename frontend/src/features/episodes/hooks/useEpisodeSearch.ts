/**
 * T039 — useEpisodeSearch.
 *
 * Debounced search over the episode feed. Cancels the previous in-flight
 * request when the debounced value changes (FR-001 + edge case
 * "rapid successive searches").
 */

"use client";

import { useDebounce } from "@/shared/hooks";
import { useEpisodesFeed } from "./useEpisodesFeed";

export interface UseEpisodeSearchOptions {
  search: string;
  debounceMs?: number;
}

export function useEpisodeSearch({ search, debounceMs = 300 }: UseEpisodeSearchOptions) {
  const debounced = useDebounce(search, debounceMs);
  return useEpisodesFeed({ search: debounced });
}
