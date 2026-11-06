import type { ReactNode } from "react";
import HelpTooltip from "@/src/components/ui/HelpTooltip";

interface ComponentCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  /** Una línea corta bajo el título; lo largo va en `help`. */
  desc?: ReactNode;
  /** Explicación detallada en el tooltip (?) junto al título. */
  help?: string;
  /** Junto al título (badges de estado). */
  badges?: ReactNode;
  /** Botones a la derecha de la cabecera. */
  actions?: ReactNode;
}

/**
 * Sección con cabecera y cuerpo — copia de common/ComponentCard del template
 * TailAdmin. Agrega `badges` y `actions` en la cabecera.
 */
export default function ComponentCard({
  title,
  children,
  className = "",
  desc,
  help,
  badges,
  actions,
}: ComponentCardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
            {help && <HelpTooltip content={help} placement="bottom" />}
            {badges}
          </div>
          {desc && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>

      {/* Card Body */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
