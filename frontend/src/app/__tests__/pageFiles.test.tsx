/**
 * T035 (004 T058) — page-composition test.
 *
 * Imports every page file under `src/app/**\/page.tsx` (composition proof)
 * and asserts the page budget from the spec: ≤ 150 lines per page
 * (≤ 80 for `add-podcast/page.tsx`), no direct `fetch()` call, and no
 * `"use client"` page holding cross-cutting state in a raw `useState`.
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const SRC_ROOT = resolve(process.cwd(), "src");
const APP_ROOT = join(SRC_ROOT, "app");

function walkPages(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (entry === "__tests__" || entry === "api") continue;
      out.push(...walkPages(abs));
    } else if (entry === "page.tsx") {
      out.push(abs);
    }
  }
  return out;
}

const pages = walkPages(APP_ROOT).sort();
const pageModules = import.meta.glob("../**/page.tsx");

const CROSS_CUTTING_USESTATE =
  /useState\s*\([^)]*(auth|user|session|theme|darkMode|isDark)/i;

describe("app page composition (004 T058)", () => {
  it("discovers every route page", () => {
    expect(pages.length).toBeGreaterThanOrEqual(9);
  });

  for (const file of pages) {
    const name = relative(SRC_ROOT, file);
    const text = readFileSync(file, "utf8");
    const lineCount = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
    const limit = name.endsWith("(protected)/add-podcast/page.tsx") ? 80 : 150;

    describe(name, () => {
      it(`is under the ${limit}-line budget`, () => {
        expect(lineCount).toBeLessThanOrEqual(limit);
      });

      it("does not call fetch() directly", () => {
        expect(text).not.toMatch(/fetch\(/);
      });

      it('does not mix "use client" with useState for cross-cutting state', () => {
        const isClient = /^["']use client["']/m.test(text);
        expect(isClient && CROSS_CUTTING_USESTATE.test(text)).toBe(false);
      });

      it("is importable (composition works)", async () => {
        const key = `../${relative(APP_ROOT, file)}`;
        const loader = pageModules[key];
        expect(loader, `glob entry for ${key}`).toBeTruthy();
        await expect(loader!()).resolves.toBeTruthy();
      });
    });
  }
});
