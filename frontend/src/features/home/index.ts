/**
 * T043 — home feature barrel.
 *
 * US2 (005-frontend-coverage-cleanup, FR-006) added the UI component
 * exports so consumers can import the feature's public surface without
 * reaching into `./ui/*` directly (the lint rule blocks that pattern).
 */

export { useHomeSearch } from "./hooks/useHomeSearch";
export { HomeClient } from "./ui/HomeClient";
export { EpisodeList } from "./ui/EpisodeList";
export { EpisodeCard } from "./ui/EpisodeCard";
export { SearchHero } from "./ui/SearchHero";
export { SearchHeader } from "./ui/SearchHeader";
export { EmptyState } from "./ui/EmptyState";
export { BottomNav } from "./ui/BottomNav";
export { FAB } from "./ui/FAB";
