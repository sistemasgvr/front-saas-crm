"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { Icon } from "@/src/components/ui/Icon";

export default function CollapsibleSection({
  title,
  icon,
  description,
  preview,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: string;
  description?: string;
  /** Texto breve visible con la sección cerrada (ej. nombre de campaña). */
  preview?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] md:p-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon name={icon} size={18} className="text-gray-600 dark:text-gray-300" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>
            {badge ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {badge}
              </span>
            ) : null}
          </div>
          {open && description ? (
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{description}</p>
          ) : preview ? (
            <p className="mt-0.5 truncate text-theme-sm text-gray-500 dark:text-gray-400">{preview}</p>
          ) : description ? (
            <p className="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">{description}</p>
          ) : null}
        </div>
        <Icon
          name={open ? "mdi:chevron-up" : "mdi:chevron-down"}
          size={22}
          className="mt-1 shrink-0 text-gray-400"
        />
      </button>
      {open ? (
        <div
          id={panelId}
          className="border-t border-gray-100 px-4 pb-4 pt-4 dark:border-gray-800 md:px-5 md:pb-5"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
