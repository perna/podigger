/**
 * T060 / FR-005, FR-015 — shared Button primitive.
 *
 * Asserts the a11y baseline on the shared Button:
 *  - renders a semantic <button> element
 *  - has a visible focus ring (className includes focus-visible:ring)
 *  - sets aria-busy when isLoading is true
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-005, FR-015
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.12
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Button } from "@/shared/ui/Button";

describe("Button", () => {
  afterEach(() => cleanup());


  it("renders a semantic <button> element", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn.tagName).toBe("BUTTON");
  });

  it("has a visible focus ring (focus-visible:ring in className)", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn.className).toMatch(/focus-visible:ring/);
  });

  it("sets aria-busy when isLoading is true", () => {
    render(<Button isLoading>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toHaveAttribute("aria-busy", "true");
  });
});
