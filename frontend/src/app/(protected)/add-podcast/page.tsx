/**
 * T087 — Add Podcast page (thin composition).
 *
 * The page is a thin Server Component that composes the AddPodcastGuard
 * from @/features/add-podcast. Visual design is preserved by the form
 * (FR-009: behaviour-preserving).
 */

import { AddPodcastGuard } from "@/features/add-podcast";

export default function AddPodcastPage() {
  return <AddPodcastGuard />;
}
