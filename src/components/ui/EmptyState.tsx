"use client";

import { Icon } from "@/src/components/ui/Icon";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  colSpan?: number;
}

export default function EmptyState({
  icon = "mdi:inbox-outline",
  title,
  description,
  colSpan,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
        <Icon name={icon} size={24} />
      </div>
      <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && <p className="mt-1 max-w-sm text-theme-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan}>{content}</td>
      </tr>
    );
  }

  return content;
}
