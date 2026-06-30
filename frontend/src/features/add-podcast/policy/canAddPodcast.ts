/**
 * T081 — canAddPodcast policy.
 */

import type { User } from "@/shared/store/slices/auth";

const ALLOWED: ReadonlySet<User["role"]> = new Set(["admin", "editor"]);

export function canAddPodcast(user: User | null): boolean {
  if (!user) return false;
  return ALLOWED.has(user.role);
}
