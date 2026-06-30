/**
 * T038 — useEpisodesFeed.
 *
 * Infinite feed of episodes via useInfiniteQuery. Cross-tab invalidation
 * happens via the QueryClient's `invalidateQueries` on a successful
 * mutation. Cache key: queryKeys.episodes(params).
 *
 * @see contracts/api-endpoints.md §"Endpoint 1"
 */

"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { episodesQueries, episodesService, type Episode } from "@/shared/api/endpoints/episodes";
import { QUERY_DEFAULTS } from "@/shared/api/queryClient";

export interface UseEpisodesFeedOptions {
  search?: string;
  pageSize?: number;
}

export function useEpisodesFeed({ search, pageSize = QUERY_DEFAULTS.pageSize }: UseEpisodesFeedOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: episodesQueries.infinite({ search }),
    queryFn: ({ pageParam = 1, signal }) =>
      episodesService.list({ search, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      try {
        const url = new URL(lastPage.next);
        const next = url.searchParams.get("page");
        return next ? Number(next) : undefined;
      } catch {
        return undefined;
      }
    },
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.previous) return undefined;
      try {
        const url = new URL(firstPage.previous);
        const prev = url.searchParams.get("page");
        return prev ? Number(prev) : undefined;
      } catch {
        return undefined;
      }
    },
  });

  const episodes: Episode[] = (query.data?.pages ?? []).flatMap((p) => p.results);

  return {
    data: episodes,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
