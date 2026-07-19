/**
 * T067 — Icon primitive.
 *
 * US2 (005-frontend-coverage-cleanup, FR-006) extended the new shared Icon
 * with the legacy `fill` / `weight` / `grade` / `opticalSize` props so that
 * the deletion of `components/ui/Icon.tsx` is a behaviour-preserving move.
 * When any of the legacy props are present, a `fontVariationSettings` style
 * is emitted to match the old Icon's rendering.
 */

import { type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "./cn";

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  label?: string;
  fill?: boolean;
  weight?: number;
  grade?: number;
  opticalSize?: number;
}

export function Icon({
  name,
  label,
  className,
  fill,
  weight,
  grade,
  opticalSize,
  style,
  ...rest
}: IconProps) {
  const legacy = fill !== undefined || weight !== undefined || grade !== undefined || opticalSize !== undefined;
  const fontVariationSettings: CSSProperties["fontVariationSettings"] = legacy
    ? `'FILL' ${fill ? 1 : 0}, 'wght' ${weight ?? 400}, 'GRAD' ${grade ?? 0}, 'opsz' ${opticalSize ?? 24}`
    : undefined;
  return (
    <span
      className={cn("material-symbols-rounded align-middle", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      style={fontVariationSettings ? { ...style, fontVariationSettings } : style}
      {...rest}
    >
      {name}
    </span>
  );
}
