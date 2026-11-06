import type { ReactNode } from "react";

interface TableCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Contenedor de tabla de página completa — patrón `BasicTableOne` del template
 * TailAdmin (free-nextjs-admin-dashboard-main/src/components/tables). Para una
 * tabla dentro de una sección con título y botones usa `TableSectionCard`.
 */
export default function TableCard({ children, footer }: TableCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 px-5 py-4 dark:border-white/[0.05] sm:px-6">{footer}</div>
      ) : null}
    </div>
  );
}

/** Clases de `BasicTableOne` (template) — úsalas en vez de escribirlas a mano. */
export const theadClass = "border-b border-gray-100 dark:border-white/[0.05]";
export const tbodyClass = "divide-y divide-gray-100 dark:divide-white/[0.05]";
export const thClass =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
export const thClassEnd =
  "px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400";
// Sin `text-start` (es el default del td): así `${tdClass} text-end` no choca.
export const tdClass = "px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400";
export const tdPrimaryClass = "px-5 py-4 sm:px-6 text-start";
