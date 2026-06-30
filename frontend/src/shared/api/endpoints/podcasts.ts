/**
 * T027 — Podcasts endpoint module.
 */

import { z } from "zod";
import { request } from "../client";
import { queryKeys } from "../queryKeys";
import type { PodcastsKey } from "../queryKeys";

export const podcastLanguageRefSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
});

export const podcastSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  feed: z.string().url().optional(),
  image: z.string().nullable().optional(),
  language: podcastLanguageRefSchema.nullable().optional(),
  total_episodes: z.number().int().nonnegative().optional().default(0),
});

export const podcastsResponseSchema = z.object({
  count: z.number().int(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(podcastSchema),
});

export const addPodcastRequestSchema = z.object({
  name: z.string().min(1),
  feed: z.string().url(),
});

export const addPodcastResponseSchema = z.object({
  id: z.number().int().optional(),
  status: z.enum(["created", "existing", "error"]),
  message: z.string().optional(),
});

export type Podcast = z.infer<typeof podcastSchema>;
export type PodcastsResponse = z.infer<typeof podcastsResponseSchema>;
export type AddPodcastRequest = z.infer<typeof addPodcastRequestSchema>;
export type AddPodcastResponse = z.infer<typeof addPodcastResponseSchema>;
export type PodcastLanguageRef = z.infer<typeof podcastLanguageRefSchema>;

export interface ListPodcastsParams {
  search?: string;
  page?: number;
  language?: number | null;
}

export const podcastsQueries = {
  list: (params: ListPodcastsParams = {}): PodcastsKey => queryKeys.podcasts(params),
  byId: (id: number): readonly ["podcasts", { id: number }] =>
    ["podcasts", { id }] as const,
} as const;

export const podcastsService = {
  async list({
    search,
    page = 1,
    language,
  }: ListPodcastsParams): Promise<PodcastsResponse> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (language != null) params.set("language", String(language));
    params.set("page", String(page));
    const qs = params.toString();
    return request({
      url: `/api/podcasts/?${qs}`,
      schema: podcastsResponseSchema,
    });
  },

  async create(input: AddPodcastRequest): Promise<AddPodcastResponse> {
    return request({
      url: "/api/podcasts/",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      schema: addPodcastResponseSchema,
    });
  },
} as const;
