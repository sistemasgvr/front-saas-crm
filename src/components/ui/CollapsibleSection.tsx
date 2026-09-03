"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import Badge, { type BadgeColor } from "@/src/components/ui/badge/Badge";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import { Icon } from "@/src/components/ui/Icon";

export default function CollapsibleSection({
  title,
  icon,
  description,
  help,
  preview,
  badge,
  badgeColor = "light",
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: string;
  description?: string;
  /** Texto de ayuda en tooltip (?), sin ocupar espacio en el encabezado. */
  help?: string;
  /** Texto breve visible con la sección cerrada (ej. nombre de campaña). */
  preview?: string;
  badge?: string;
  badgeColor?: BadgeColor;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const toggle = () => setOpen((prev) => !prev);

  return (
    <div className="overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start gap-2 p-4 md:p-5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-start gap-3 text-left transition"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon name={icon} size={18} className="text-gray-600 dark:text-gray-300" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>
              {badge ? (
                <Badge color={badgeColor} size="sm">
                  {badge}
                </Badge>
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
        </button>
        {help ? (
          <div className="mt-1 shrink-0">
            <HelpTooltip content={help} placement="bottom" align="end" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? `Cerrar ${title}` : `Abrir ${title}`}
          className="mt-1 shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
        >
          <Icon name={open ? "mdi:chevron-up" : "mdi:chevron-down"} size={22} />
        </button>
      </div>
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
