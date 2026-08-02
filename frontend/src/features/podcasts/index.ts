/**
 * T043 — podcasts feature barrel.
 *
 * US2 (005-frontend-coverage-cleanup, FR-006) added the UI component
 * exports.
 */

export { usePodcastsFeed } from "./hooks/usePodcastsFeed";
export { useLanguages } from "./hooks/useLanguages";
export { PodcastList } from "./ui/PodcastList";
export { PodcastCard } from "./ui/PodcastCard";
export { Pagination } from "./ui/Pagination";
export { LanguageFilter } from "./ui/LanguageFilter";
export type {
  Podcast,
  PodcastsResponse,
  AddPodcastRequest,
  AddPodcastResponse,
} from "@/shared/api/endpoints/podcasts";
export type { PodcastLanguage } from "@/shared/api/endpoints/languages";
