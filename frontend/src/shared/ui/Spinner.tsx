/**
 * T066 — Spinner / Skeleton primitives.
 *
 * US2 (005-frontend-coverage-cleanup, FR-006) merged the legacy
 * `components/ui/Loading.tsx` exports (`LoadingSpinner`, `FullPageLoading`)
 * into this module. The `Skeleton` here is the new shared primitive; the
 * legacy `Skeleton` and `LoadingSpinner` consumers are migrated in
 * T020–T023.
 */

import type { SVGAttributes } from "react";
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

export function LoadingSpinner({ className, ...props }: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function FullPageLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner className="size-12 text-primary" />
    </div>
  );
}
