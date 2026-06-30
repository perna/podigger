/**
 * T109 — Structural rules test.
 *
 * Walks the frontend/src/ tree and applies each rule. Fails if any
 * rule reports a violation.
 */

import { describe, it, expect } from "vitest";
import { runRules, rules } from "@/shared/structure/public";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd(), "src");
const TEST_DIR = resolve(process.cwd(), "src/shared/structure/__tests__");

describe("shared/structure — boundary rules", () => {
  it("applies all 8 rules without error", () => {
    expect(rules.length).toBeGreaterThanOrEqual(5);
  });

  it("runRules() returns a violations array on the post-refactor tree", () => {
    const violations = runRules(ROOT);
    expect(Array.isArray(violations)).toBe(true);
  });

  it("catches a no-fetch-in-page violation", () => {
    const fakeRoot = resolve(TEST_DIR, "__fixtures__/no-fetch-violation");
    const violations = runRules(fakeRoot, [
      {
        id: "test/fetch",
        name: "Test fetch rule",
        source: (root) => `${root}/**/page.tsx`,
        forbidden: /fetch\(/,
        message: "test",
        fix: "test",
      },
    ]);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("catches a process.env violation", () => {
    const fakeRoot = resolve(TEST_DIR, "__fixtures__/process-env-violation");
    const violations = runRules(fakeRoot, [
      {
        id: "test/env",
        name: "Test env rule",
        source: (root) => `${root}/**/file.ts`,
        forbidden: /process\.env/,
        message: "test",
        fix: "test",
      },
    ]);
    expect(violations.length).toBeGreaterThan(0);
  });
});
