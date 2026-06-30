/**
 * T067 — Icon primitive.
 */

import { type HTMLAttributes } from "react";
import { cn } from "./cn";

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  label?: string;
}

export function Icon({ name, label, className, ...rest }: IconProps) {
  return (
    <span
      className={cn("material-symbols-rounded align-middle", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...rest}
    >
      {name}
    </span>
  );
}
