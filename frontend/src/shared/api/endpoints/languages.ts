/**
 * T028 — Languages endpoint module.
 */

import { z } from "zod";
import { request } from "../client";
import { queryKeys } from "../queryKeys";
import type { LanguagesKey } from "../queryKeys";

export const podcastLanguageSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
});

export type PodcastLanguage = z.infer<typeof podcastLanguageSchema>;

export const languagesQueries = {
  list: (): LanguagesKey => queryKeys.languages(),
} as const;

export const languagesService = {
  async list(): Promise<PodcastLanguage[]> {
    return request({
      url: "/api/languages/",
      schema: z.array(podcastLanguageSchema),
    });
  },
} as const;
