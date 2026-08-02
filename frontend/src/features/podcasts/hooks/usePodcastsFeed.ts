/**
 * T040 — usePodcastsFeed.
 */

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { podcastsQueries, podcastsService } from "@/shared/api/endpoints/podcasts";

export interface UsePodcastsFeedOptions {
  search?: string;
  language?: number | null;
  page?: number;
}

export function usePodcastsFeed({ search, language, page = 1 }: UsePodcastsFeedOptions = {}) {
  const query = useQuery({
    queryKey: podcastsQueries.list({ search, page, language }),
    queryFn: ({ signal }) => podcastsService.list({ search, page, language, signal } as { search?: string; page?: number; language?: number | null } & { signal: AbortSignal }),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
