/**
 * T011 — Env validation test (write first, ensure FAIL before T016)
 *
 * Validates that the env module throws with a named error message when a
 * required environment variable is missing or malformed (SC-004).
 *
 * This test MUST fail before the env module (T016) is implemented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("shared/env/env", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when NEXT_PUBLIC_API_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    await expect(() => import("@/shared/env/env")).rejects.toThrow(
      /NEXT_PUBLIC_API_URL/,
    );
  });

  it("throws when NEXT_PUBLIC_API_URL is not a URL or absolute path", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "not-a-url");
    await expect(() => import("@/shared/env/env")).rejects.toThrow(
      /NEXT_PUBLIC_API_URL/,
    );
  });

  it("accepts a relative path starting with '/'", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/proxy");
    const mod = await import("@/shared/env/env");
    expect(mod.env.NEXT_PUBLIC_API_URL).toBe("/api/proxy");
  });

  it("accepts an https URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.podigger.com");
    const mod = await import("@/shared/env/env");
    expect(mod.env.NEXT_PUBLIC_API_URL).toBe("https://api.podigger.com");
  });

  it("uses default 20 for NEXT_PUBLIC_DEFAULT_PAGE_SIZE when omitted", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_PAGE_SIZE", "");
    const mod = await import("@/shared/env/env");
    expect(mod.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE).toBe(20);
  });

  it("coerces NEXT_PUBLIC_DEFAULT_PAGE_SIZE to a number", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_PAGE_SIZE", "50");
    const mod = await import("@/shared/env/env");
    expect(mod.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE).toBe(50);
  });

  it("throws when NEXT_PUBLIC_DEFAULT_PAGE_SIZE is not a positive integer", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_PAGE_SIZE", "abc");
    await expect(() => import("@/shared/env/env")).rejects.toThrow();
  });

  it("uses default 10000 for NEXT_PUBLIC_REQUEST_TIMEOUT_MS when omitted", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    vi.stubEnv("NEXT_PUBLIC_REQUEST_TIMEOUT_MS", "");
    const mod = await import("@/shared/env/env");
    expect(mod.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS).toBe(10_000);
  });

  it("error message names the failing variable and expected shape", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    try {
      await import("@/shared/env/env");
      expect.fail("Expected import to throw");
    } catch (err: unknown) {
      expect(String(err)).toMatch(/NEXT_PUBLIC_API_URL/);
    }
  });
});
