/**
 * T073 — auth types.
 */

import type { User } from "@/shared/store/slices/auth";

export type { User };

export type LoginInput = { email: string; password: string };
export type RegisterInput = { email: string; password: string };

export type AuthError =
  | { kind: "validation"; message: string }
  | { kind: "auth"; message: string }
  | { kind: "server"; message: string }
  | { kind: "network"; message: string }
  | { kind: "unknown"; message: string };
