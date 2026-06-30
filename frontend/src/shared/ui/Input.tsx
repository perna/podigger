/**
 * T064 — Input primitive.
 */

"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-surface-700 dark:text-surface-200">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-white px-3 py-2",
          "dark:bg-surface-900",
          error
            ? "border-red-500 focus-within:ring-2 focus-within:ring-red-400"
            : "border-surface-300 focus-within:ring-2 focus-within:ring-primary-500 dark:border-surface-700",
        )}
      >
        {leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400", className)}
          {...rest}
        />
        {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-surface-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
});
