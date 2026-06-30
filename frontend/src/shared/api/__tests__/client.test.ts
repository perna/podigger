/**
 * T012 — Fetch wrapper test (write first, ensure FAIL before T023)
 *
 * Validates that the `request()` wrapper maps HTTP/network responses to the
 * correct AppError subclass per contracts/error-types.md §"Mapping table".
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

// Delay import so vi.stubGlobal works before the module loads.
let request: typeof import("@/shared/api/client").request;

describe("shared/api/client — request()", () => {
  const schema = z.object({ id: z.number(), name: z.string() });
  const validPayload = { id: 1, name: "test" };
  const url = "http://localhost:8000/api/test/";

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("@/shared/api/client");
    request = mod.request;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves to the parsed payload on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(validPayload), { status: 200 }),
      ),
    );
    const result = await request({ url, schema });
    expect(result).toEqual(validPayload);
  });

  it("throws AuthError on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    const { AuthError } = await import("@/shared/api/errors");
    await expect(request({ url, schema })).rejects.toBeInstanceOf(AuthError);
  });

  it("throws AuthError on 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 403 })),
    );
    const { AuthError } = await import("@/shared/api/errors");
    await expect(request({ url, schema })).rejects.toBeInstanceOf(AuthError);
  });

  it("throws ValidationError on 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 400 })),
    );
    const { ValidationError } = await import("@/shared/api/errors");
    await expect(request({ url, schema })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("throws ValidationError on 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 422 })),
    );
    const { ValidationError } = await import("@/shared/api/errors");
    await expect(request({ url, schema })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("throws ServerError on 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 })),
    );
    const { ServerError } = await import("@/shared/api/errors");
    await expect(request({ url, schema })).rejects.toBeInstanceOf(ServerError);
  });

  it("throws NetworkError on fetch throw (TypeError)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    const { NetworkError } = await import("@/shared/api/errors");
    await expect(request({ url, schema })).rejects.toBeInstanceOf(NetworkError);
  });

  it("throws AbortError when AbortController aborts", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        const err = new DOMException("The user aborted a request.", "AbortError");
        return Promise.reject(err);
      }),
    );
    const { AbortError: AppAbortError } = await import("@/shared/api/errors");
    await expect(
      request({ url, schema, signal: controller.signal }),
    ).rejects.toBeInstanceOf(AppAbortError);
  });

  it("throws ValidationError with Zod issues when response body doesn't match schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "not-a-number" }), { status: 200 }),
      ),
    );
    const { ValidationError } = await import("@/shared/api/errors");
    const err = await request({ url, schema }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.details).toBeDefined();
  });
});
