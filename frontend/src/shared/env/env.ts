/**
 * Typed environment module for the Podigger front-end.
 *
 * Validates every environment variable the front-end reads at module load
 * time using Zod. If any required variable is missing or malformed, this
 * module throws with a message that names the failing variable and the
 * expected shape (SC-004).
 *
 * The throw is caught by Next.js at start and rendered as the dev/prod
 * error page; the front-end never boots with a malformed env.
 *
 * @see contracts/env-schema.md for the full schema documentation.
 *
 * Usage:
 * ```ts
 * import { env } from "@/shared/env";
 *
 * const url = `${env.NEXT_PUBLIC_API_URL}/api/episodes/`;
 * const timeout = env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS;
 * ```
 *
 * `process.env` must NOT be read anywhere else. The structural tests
 * (FR-013) flag any `process.env` reference outside this file as a
 * violation.
 */

import { z } from "zod";

const envSchema = z.object({
  /**
   * The back-end API base URL. Either a full URL (e.g. https://api.podigger.com)
   * or a relative path to the local proxy (e.g. "/api/proxy"). The fetch
   * wrapper routes through the proxy in the second case.
   */
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_URL must not be empty")
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//.test(v),
      "NEXT_PUBLIC_API_URL must be a URL or an absolute path starting with '/'",
    ),

  /**
   * Optional: the default page size for the episodes / podcasts list
   * endpoints. Defaults to 20. Used by the query layer to set
   * initialPageParam.
   */
  NEXT_PUBLIC_DEFAULT_PAGE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(20),

  /**
   * Optional: the request timeout in milliseconds. Defaults to 10 000.
   * The fetch wrapper uses an AbortController with this timeout.
   */
  NEXT_PUBLIC_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10_000),

  /** NODE_ENV is set by Next.js itself; we type it for exhaustive switches. */
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function formatZodError(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.join(".");
    return `  - ${path}: ${issue.message}`;
  });
  return `Invalid environment configuration:\n${lines.join("\n")}`;
}

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DEFAULT_PAGE_SIZE: process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE || undefined,
  NEXT_PUBLIC_REQUEST_TIMEOUT_MS: process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS || undefined,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(formatZodError(parsed.error));
}

/**
 * The typed, validated environment object. Import this instead of
 * reading `process.env` directly anywhere in the app.
 */
export const env: Env = parsed.data;
