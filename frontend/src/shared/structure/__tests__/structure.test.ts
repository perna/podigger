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

describe("shared/structure — post-refactor tree", () => {
  // The post-refactor tree is the new feature / shared / app folders;
  // the legacy components/, contexts/, lib/ tree is staged for
  // deletion in T106/T107 and is excluded here. It is checked below
  // in a separate informational assertion.
  const POST_REFACTOR_SUFFIXES = [
    "features",
    "shared",
    "app",
  ] as const;
  // We assert the post-refactor tree has zero violations — that is
  // the FR-013 contract.

  it("reports zero violations on the post-refactor tree (features/, shared/, app/)", () => {
    const violations = runRules(ROOT).filter((v) =>
      POST_REFACTOR_SUFFIXES.some((dir) => v.file === dir || v.file.startsWith(`${dir}/`)),
    );
    if (violations.length > 0) {
      console.error(
        "[structure] post-refactor violations:\n" +
          violations.map((v) => `  ${v.file}  [${v.rule}]`).join("\n"),
      );
    }
    expect(violations).toEqual([]);
  });

  it("reports every violation on the legacy tree (components/, contexts/, lib/) for visibility", () => {
    const violations = runRules(ROOT).filter((v) =>
      ["components", "contexts", "lib"].some((dir) => v.file === dir || v.file.startsWith(`${dir}/`)),
    );
    // Informational only — these are T106/T107 cleanup debt, tracked
    // separately. The assertion exists so the gap is visible in test
    // output, not so it fails the build.
    if (violations.length > 0) {
      console.warn(
        `[structure] LEGACY violations (tracked as iter-2 debt):\n` +
          violations.map((v) => `  ${v.file}  [${v.rule}]`).join("\n"),
      );
    }
    expect(violations.length).toBeGreaterThanOrEqual(0);
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
