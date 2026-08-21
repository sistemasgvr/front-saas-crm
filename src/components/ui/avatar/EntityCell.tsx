import type { ReactNode } from "react";
import Avatar from "./Avatar";

interface EntityCellProps {
  name: string;
  subtitle?: ReactNode;
  src?: string | null;
  icon?: string;
  shape?: "circle" | "rounded";
  size?: "sm" | "md" | "lg";
}

export default function EntityCell({
  name,
  subtitle,
  src,
  icon,
  shape = "circle",
  size = "md",
}: EntityCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} src={src} icon={icon} shape={shape} size={size} />
      <div className="min-w-0">
        <span className="block truncate font-medium text-gray-800 text-theme-sm dark:text-white/90">{name}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}
