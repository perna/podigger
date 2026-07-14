/**
 * T060 / FR-005, FR-015 — shared Input primitive.
 *
 * Asserts the a11y baseline on the shared Input:
 *  - forwards aria-invalid to the underlying <input>
 *  - forwards aria-describedby to the underlying <input> and the
 *    described element's id matches the hint or error message
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-005, FR-015
 * @see specs/005-frontend-coverage-cleanup/data-model.md §1.12
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Input } from "@/shared/ui/Input";

describe("Input", () => {
  afterEach(() => cleanup());

  it("forwards aria-invalid to the underlying <input>", () => {
    render(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards aria-describedby to the hint element when hint is provided", () => {
    render(<Input label="Email" hint="We will not share your address" />);
    const input = screen.getByLabelText("Email");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const hintEl = screen.getByText("We will not share your address");
    expect(hintEl).toHaveAttribute("id", describedBy);
  });

  it("forwards aria-describedby to the error element when error is provided", () => {
    render(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText("Email");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = screen.getByText("Invalid email");
    expect(errorEl).toHaveAttribute("id", describedBy);
  });
});
