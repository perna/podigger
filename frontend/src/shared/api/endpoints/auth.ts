/**
 * T029 — Auth endpoint module.
 */

import { z } from "zod";
import { request } from "../client";
import { queryKeys } from "../queryKeys";
import type { SessionKey } from "../queryKeys";

export const userSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "reader"]),
});
export type User = z.infer<typeof userSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  user: userSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const registerResponseSchema = z.object({
  user: userSchema,
});
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const sessionResponseSchema = z.object({
  user: userSchema,
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const sessionQueries = {
  current: (): SessionKey => queryKeys.session(),
} as const;

const voidSchema = z.unknown().transform(() => undefined);

export const authService = {
  async login(input: LoginRequest): Promise<LoginResponse> {
    return request({
      url: "/api/auth/login/",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      schema: loginResponseSchema,
    });
  },

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    return request({
      url: "/api/auth/register/",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      schema: registerResponseSchema,
    });
  },

  async logout(): Promise<void> {
    await request({
      url: "/api/auth/logout/",
      init: { method: "POST" },
      schema: voidSchema,
    });
  },

  async refresh(): Promise<{ access: string }> {
    return request({
      url: "/api/auth/refresh/",
      init: { method: "POST" },
      schema: z.object({ access: z.string() }),
    });
  },

  async session(): Promise<SessionResponse> {
    return request({
      url: "/api/auth/session/",
      schema: sessionResponseSchema,
    });
  },
} as const;
