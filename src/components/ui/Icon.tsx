"use client";

import { Icon as IconifyIcon } from '@iconify/react';

interface IconProps {
  name: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  color?: string;
  className?: string;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

export function Icon({ name, size = 20, width, height, color, className, rotate, hFlip, vFlip }: IconProps) {
  return (
    <IconifyIcon
      icon={name}
      width={width ?? size}
      height={height ?? size}
      color={color}
      className={className}
      rotate={rotate}
      hFlip={hFlip}
      vFlip={vFlip}
    />
  );
}
