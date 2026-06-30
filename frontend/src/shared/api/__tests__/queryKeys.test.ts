/**
 * T014 — Query-key factory test (write first, ensure FAIL before T025)
 *
 * Validates that each factory returns a stable, structurally-correct tuple
 * per contracts/api-endpoints.md §"Query-key contract".
 */

import { describe, it, expect } from "vitest";
import { queryKeys } from "@/shared/api/queryKeys";

describe("shared/api/queryKeys", () => {
  it("episodes() returns a stable tuple with resource and params", () => {
    const key = queryKeys.episodes({ search: "react", page: 2 });
    expect(key).toEqual(["episodes", { search: "react", page: 2 }]);
  });

  it("episodes() with no args returns a stable base tuple", () => {
    const key = queryKeys.episodes();
    expect(key[0]).toBe("episodes");
  });

  it("podcasts() returns a stable tuple with resource and params", () => {
    const key = queryKeys.podcasts({ search: "tech", page: 1, language: 3 });
    expect(key).toEqual(["podcasts", { search: "tech", page: 1, language: 3 }]);
  });

  it("podcasts() with no args returns a stable base tuple", () => {
    const key = queryKeys.podcasts();
    expect(key[0]).toBe("podcasts");
  });

  it("languages() returns a stable tuple", () => {
    const key = queryKeys.languages();
    expect(key).toEqual(["languages"]);
  });

  it("session() returns a stable tuple", () => {
    const key = queryKeys.session();
    expect(key).toEqual(["session"]);
  });

  it("same params produce referentially different but structurally equal arrays", () => {
    const a = queryKeys.episodes({ search: "x" });
    const b = queryKeys.episodes({ search: "x" });
    // Not the same reference (arrays are created fresh)
    expect(a).not.toBe(b);
    // But structurally equal
    expect(a).toEqual(b);
  });
});
