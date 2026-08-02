/**
 * T072 — canView policy.
 */

import type { User } from "@/shared/store/slices/auth";

export function canView(user: User | null): boolean {
  return user !== null;
}
