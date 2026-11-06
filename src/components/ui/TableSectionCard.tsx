import type { ReactNode } from "react";
import HelpTooltip from "@/src/components/ui/HelpTooltip";

interface TableSectionCardProps {
  title: string;
  /** Una línea corta bajo el título; lo largo va en `help`. */
  desc?: ReactNode;
  /** Explicación detallada en el tooltip (?) junto al título. */
  help?: string;
  /** Botones a la derecha del título. */
  actions?: ReactNode;
  /** Tabla (o EmptyState cuando no hay filas). */
  children: ReactNode;
  /** Paginación u otro pie debajo de la tabla. */
  footer?: ReactNode;
}

/**
 * Tabla dentro de una sección con título y botones — patrón `RecentOrders`
 * del template TailAdmin (ecommerce/RecentOrders.tsx). Para una tabla de
 * página completa usa `TableCard`.
 */
export default function TableSectionCard({ title, desc, help, actions, children, footer }: TableSectionCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            {help && <HelpTooltip content={help} placement="bottom" />}
          </div>
          {desc && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <div className="max-w-full overflow-x-auto">{children}</div>
      {footer && <div className="mt-3 border-t border-gray-100 pt-4 pb-1 dark:border-gray-800">{footer}</div>}
    </div>
  );
}

/**
 * Clases de `RecentOrders` (template) para las tablas de `TableSectionCard`.
 * Agregado al template: `pr-4` entre columnas y `whitespace-nowrap` (con muchas
 * columnas las celdas quedaban pegadas y las fechas partidas).
 */
export const sectionTheadClass = "border-gray-100 dark:border-gray-800 border-y";
export const sectionTbodyClass = "divide-y divide-gray-100 dark:divide-gray-800";
export const sectionThClass =
  "py-3 pr-4 last:pr-0 whitespace-nowrap font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
export const sectionThClassEnd =
  "py-3 pr-4 last:pr-0 whitespace-nowrap font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400";
export const sectionTdClass = "py-3 pr-4 last:pr-0 whitespace-nowrap text-gray-500 text-theme-sm dark:text-gray-400";
/** Primera columna (nombre): puede ocupar varias líneas; limita su ancho con un wrapper `max-w-*`. */
export const sectionTdPrimaryClass = "py-3 pr-4";
