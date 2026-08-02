/**
 * T025 — Query-key factories.
 *
 * Every query key is a tuple of [resource, params]. Mutations reference
 * these factories (never literal keys) so structural tests can flag
 * any literal query key in feature code.
 *
 * @see contracts/api-endpoints.md §"Query-key contract"
 */

export const queryKeys = {
  episodes: (params: { search?: string; page?: number } = {}) =>
    ["episodes", params] as const,
  podcasts: (
    params: { search?: string; page?: number; language?: number | null } = {},
  ) => ["podcasts", params] as const,
  languages: () => ["languages"] as const,
  session: () => ["session"] as const,
} as const;

export type EpisodesKey = ReturnType<typeof queryKeys.episodes>;
export type PodcastsKey = ReturnType<typeof queryKeys.podcasts>;
export type LanguagesKey = ReturnType<typeof queryKeys.languages>;
export type SessionKey = ReturnType<typeof queryKeys.session>;
