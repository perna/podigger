/**
 * T109 — Structural rules test.
 *
 * Walks the frontend/src/ tree and applies each rule. Fails if any
 * rule reports a violation. Also asserts the matcher is non-trivial
 * by checking that a synthetic process.env read in a temp file IS
 * caught.
 */

import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { runRules, rules } from "@/shared/structure/public";
import type { Rule } from "@/shared/structure/types";

const ROOT = resolve(process.cwd(), "src");

describe("shared/structure — registry", () => {
  it("registers every documented boundary rule", () => {
    expect(rules.length).toBeGreaterThanOrEqual(6);
    const ids = rules.map((r) => r.id);
    expect(ids).toContain("cross/no-fetch-in-page");
    expect(ids).toContain("cross/no-raw-usestate-for-cross-cutting");
    expect(ids).toContain("cross/no-process-env-outside-env-module");
    expect(ids).toContain("cross/no-localstorage-outside-store");
    expect(ids).toContain("page-files-are-short");
  });
});

describe("shared/structure — full src/ tree", () => {
  // FR-008 (005-frontend-coverage-cleanup): the structural test asserts
  // zero violations against the FULL src/ tree — the legacy components/,
  // contexts/, lib/ tree MUST be gone, not just "informational".
  it("reports zero violations on the full src/ tree (no legacy exemptions)", () => {
    const violations = runRules(ROOT);
    if (violations.length > 0) {
      console.error(
        "[structure] full-tree violations:\n" +
          violations.map((v) => `  ${v.file}  [${v.rule}]`).join("\n"),
      );
    }
    expect(violations).toEqual([]);
  });
});

describe("shared/structure — matcher kills behaviour", () => {
  let scratch: string;

  beforeAll(() => {
    scratch = mkdtempSync(join(tmpdir(), "structure-scratch-"));
    writeFileSync(join(scratch, "evil.ts"), 'const x = process.env.NEXT_PUBLIC_API_URL;\n');
    writeFileSync(join(scratch, "good.ts"), 'import { env } from "@/shared/env";\n');
  });

  afterAll(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it("catches a process.env read in a real temp file via a custom rule", () => {
    const custom: Rule = {
      id: "test/env",
      name: "Test env rule",
      source: (root) => `${root}/**/*.ts`,
      forbidden: /process\.env/,
      message: "test",
      fix: "test",
      ignore: (file) => file.includes("__tests__"),
    };
    const violations = runRules(scratch, [custom]);
    expect(violations.length).toBe(1);
    expect(violations[0]?.file).toMatch(/evil\.ts$/);
  });

  it("catches a fetch call in a real temp file via a custom rule", () => {
    writeFileSync(join(scratch, "page.tsx"), "export default function Page() { fetch('/x'); return null; }\n");
    const custom: Rule = {
      id: "test/fetch",
      name: "Test fetch rule",
      source: (root) => `${root}/**/page.tsx`,
      forbidden: /fetch\(/,
      message: "test",
      fix: "test",
    };
    const violations = runRules(scratch, [custom]);
    expect(violations.length).toBe(1);
    expect(violations[0]?.file).toMatch(/page\.tsx$/);
  });
});
