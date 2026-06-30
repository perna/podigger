/**
 * T066 — Spinner / Skeleton primitives.
 */

import { cn } from "./cn";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-block size-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent", className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-label="Loading content"
      role="status"
      className={cn("block animate-pulse rounded-md bg-surface-200 dark:bg-surface-800", className)}
    />
  );
}
