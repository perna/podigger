/**
 * T026 — Episodes endpoint module.
 *
 * Exports the Zod schemas (episodeSchema, episodesResponseSchema), the
 * episodesQueries helpers, and the episodesService.
 */

import { z } from "zod";
import { request } from "../client";
import { queryKeys } from "../queryKeys";
import type { EpisodesKey } from "../queryKeys";

export const tagSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const podcastRefSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  image: z.string().nullable(),
});

export const episodeSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  link: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  published: z.string(),
  enclosure: z.string().nullable().optional(),
  podcast: podcastRefSchema,
  tags: z.array(tagSchema).optional().default([]),
});

export const episodesResponseSchema = z.object({
  count: z.number().int(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(episodeSchema),
});

export type Episode = z.infer<typeof episodeSchema>;
export type EpisodesResponse = z.infer<typeof episodesResponseSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type PodcastRef = z.infer<typeof podcastRefSchema>;

export interface ListEpisodesParams {
  search?: string;
  page?: number;
}

export const episodesQueries = {
  list: (params: ListEpisodesParams = {}): EpisodesKey => queryKeys.episodes(params),
  infinite: (params: { search?: string } = {}): EpisodesKey =>
    queryKeys.episodes({ search: params.search }),
} as const;

export const episodesService = {
  async list({ search, page = 1 }: ListEpisodesParams): Promise<EpisodesResponse> {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(page));
    const qs = params.toString();
    return request({
      url: `/api/episodes/?${qs}`,
      schema: episodesResponseSchema,
    });
  },

  async infinite({ search }: { search?: string }): Promise<EpisodesResponse> {
    return episodesService.list({ search, page: 1 });
  },
} as const;
