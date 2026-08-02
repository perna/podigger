/**
 * T043 — episodes feature barrel.
 *
 * US2 (005-frontend-coverage-cleanup, FR-006) added the UI component
 * exports.
 */

export { useEpisodesFeed } from "./hooks/useEpisodesFeed";
export { useEpisodeSearch } from "./hooks/useEpisodeSearch";
export { EpisodeCardCompact } from "./ui/EpisodeCardCompact";
export type { Episode, EpisodesResponse } from "@/shared/api/endpoints/episodes";
