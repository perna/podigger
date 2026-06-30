/**
 * T065 — Card primitives.
 */

import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-200 bg-white p-4 shadow-sm",
        "dark:border-surface-800 dark:bg-surface-900",
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
