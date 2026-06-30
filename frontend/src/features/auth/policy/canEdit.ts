/**
 * T071 — canEdit policy.
 *
 * Encoded as a lookup table, not an if chain (so the structural test
 * "no business rule embedded in a render function" is satisfied).
 */

import type { User } from "@/shared/store/slices/auth";

const ALLOWED: ReadonlySet<User["role"]> = new Set(["admin", "editor"]);

export function canEdit(user: User | null): boolean {
  if (!user) return false;
  return ALLOWED.has(user.role);
}
