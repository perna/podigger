/**
 * T043 — podcasts feature barrel.
 */

export { usePodcastsFeed } from "./hooks/usePodcastsFeed";
export { useLanguages } from "./hooks/useLanguages";
export type {
  Podcast,
  PodcastsResponse,
  AddPodcastRequest,
  AddPodcastResponse,
} from "@/shared/api/endpoints/podcasts";
export type { PodcastLanguage } from "@/shared/api/endpoints/languages";
