"use client";

import { Icon as IconifyIcon } from "@iconify/react";
import type { CSSProperties } from "react";

export type IconProps = {
  /** Iconify name, e.g. `mdi:home`, `solar:chart-bold` */
  name: string;
  /** Shortcut for width and height. Default: 20 */
  size?: number | string;
  width?: number | string;
  height?: number | string;
  /** CSS color; defaults to currentColor via Iconify */
  color?: string;
  className?: string;
  style?: CSSProperties;
  inline?: boolean;
  /** Iconify rotate: 0–3 (×90°) or degrees number */
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
};

/**
 * Reusable Iconify wrapper. Prefer this over inline SVGs.
 *
 * @example
 * <Icon name="mdi:home" size={20} />
 * <Icon name="mdi:account" size={24} color="#465fff" className="shrink-0" />
 */
export function Icon({
  name,
  size = 20,
  width,
  height,
  color,
  className,
  style,
  inline,
  rotate,
  hFlip,
  vFlip,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;
  const isDecorative = ariaLabel == null && ariaHidden !== false;

  return (
    <IconifyIcon
      icon={name}
      width={resolvedWidth}
      height={resolvedHeight}
      color={color}
      className={className}
      style={style}
      inline={inline}
      rotate={rotate}
      hFlip={hFlip}
      vFlip={vFlip}
      aria-label={ariaLabel}
      aria-hidden={isDecorative ? true : ariaHidden}
    />
  );
}
