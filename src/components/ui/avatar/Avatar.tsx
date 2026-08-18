"use client";

import { useState } from "react";
import { Icon } from "@/src/components/ui/Icon";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type AvatarShape = "circle" | "rounded";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  shape?: AvatarShape;
  icon?: string;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-lg",
};

const iconSizes: Record<AvatarSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

const palettes = [
  "bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
  "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
  "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400",
  "bg-error-100 text-error-600 dark:bg-error-500/15 dark:text-error-400",
];

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function colorFrom(name: string) {
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[index % palettes.length];
}

export default function Avatar({
  name,
  src,
  size = "md",
  shape = "circle",
  icon,
  className = "",
}: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(src) && !broken;
  const radius = shape === "circle" ? "rounded-full" : "rounded-lg";

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${radius} ${sizeClasses[size]} ${
        showImage ? "bg-gray-100 dark:bg-gray-800" : colorFrom(name)
      } ${className}`}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs de logo/avatar son arbitrarias
        <img
          src={src ?? ""}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : icon ? (
        <Icon name={icon} size={iconSizes[size]} />
      ) : (
        <span className="font-medium">{initialsFrom(name)}</span>
      )}
    </div>
  );
}
