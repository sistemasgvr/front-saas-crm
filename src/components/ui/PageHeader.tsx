"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: {
    href: string;
    label: string;
    icon?: string;
  };
  children?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Volver",
  action,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Icon name="mdi:chevron-left" size={18} />
            {backLabel}
          </Link>
        )}
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{title}</h1>
        {description && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {action && (
          <Link href={action.href}>
            <Button
              size="sm"
              startIcon={<Icon name={action.icon ?? "mdi:plus"} size={18} />}
            >
              {action.label}
            </Button>
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
