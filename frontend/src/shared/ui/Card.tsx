/**
 * T065 — Card primitives.
 *
 * US2 (005-frontend-coverage-cleanup, FR-006) added the optional
 * `hoverable` prop so that the deletion of `components/ui/Card.tsx` is a
 * behaviour-preserving move. When `hoverable` is true, the Card applies the
 * legacy hover shadow + lift transition.
 */

import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-all",
        "dark:border-surface-800 dark:bg-surface-900",
        hoverable && "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-center justify-between", className)} {...rest} />;
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm", className)} {...rest} />;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mt-3 flex items-center gap-2", className)}>{children}</div>;
}
