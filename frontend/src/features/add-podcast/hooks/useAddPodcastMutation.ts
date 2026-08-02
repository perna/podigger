/**
 * T083 — useAddPodcastMutation.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { podcastsService, queryKeys } from "@/shared/api";
import type { AddPodcastInput } from "../types";

export function useAddPodcastMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddPodcastInput) => podcastsService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.podcasts() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.podcasts({ search: "" }) });
    },
  });
}
