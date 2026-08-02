/**
 * T085 — AddPodcastGuard.
 */

"use client";

import { AuthBoundary } from "@/features/auth";
import { canAddPodcast } from "../policy/canAddPodcast";
import { AddPodcastForm } from "./AddPodcastForm";

export function AddPodcastGuard() {
  return (
    <AuthBoundary predicate={canAddPodcast}>
      <AddPodcastForm />
    </AuthBoundary>
  );
}
