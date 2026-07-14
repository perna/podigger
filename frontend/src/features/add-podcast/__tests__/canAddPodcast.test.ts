/**
 * T059 / FR-004 — canAddPodcast role lookup.
 *
 * Asserts the policy:
 *  - admin → true
 *  - editor → true
 *  - reader → false
 *  - null → false
 *  - encoded as a Set lookup, not an if-chain
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-004
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.9
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canAddPodcast } from "@/features/add-podcast/policy/canAddPodcast";
import type { User } from "@/shared/store/slices/auth";

const user = (role: User["role"]): User => ({ email: "a@b.co", role });

describe("canAddPodcast", () => {
  it("admin can add", () => {
    expect(canAddPodcast(user("admin"))).toBe(true);
  });

  it("editor can add", () => {
    expect(canAddPodcast(user("editor"))).toBe(true);
  });

  it("reader cannot add", () => {
    expect(canAddPodcast(user("reader"))).toBe(false);
  });

  it("null user cannot add", () => {
    expect(canAddPodcast(null)).toBe(false);
  });

  it("is encoded as a Set lookup, not an if-chain", () => {
    // ponytail: read the source and assert the structural shape
    // (a Set literal in the module body). This is a code-quality
    // guard: a future contributor who refactors to an if-chain
    // breaks the test and is forced to justify the change.
    const source = readFileSync(
      resolve(process.cwd(), "src/features/add-podcast/policy/canAddPodcast.ts"),
      "utf8",
    );
    expect(source).toMatch(/new Set\(/);
    expect(source).not.toMatch(/if\s*\(\s*role\s*===\s*["']admin["']/);
  });
});
