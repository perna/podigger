/**
 * T110 — A11y no-regression test.
 *
 * Asserts no removed aria attributes, no swapped semantic elements, no
 * removed tabIndex on previously focusable controls.
 */

import { describe, it, expect } from "vitest";
import { runRules } from "@/shared/structure/public";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd(), "src");

describe("shared/structure — a11y no-regression", () => {
  it("no <div onClick> where a <button> should be used", () => {
    const violations = runRules(ROOT);
    const divOnClick = violations.filter((v) => v.rule === "a11y/no-semantic-regression");
    expect(divOnClick).toHaveLength(0);
  });
});
