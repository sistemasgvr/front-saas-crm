import type { ReactNode } from "react";

export interface MobileCardField {
  label: string;
  value: ReactNode;
}

interface MobileCardProps {
  /** Identidad de la fila (normalmente un EntityCell o un enlace). */
  header: ReactNode;
  /** Badges a la derecha del header. */
  aside?: ReactNode;
  /** Pares etiqueta/valor — las columnas de la tabla. */
  fields?: MobileCardField[];
  /** Acciones de la fila (TableAction, botones) en el pie. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Fila de tabla en formato tarjeta para pantallas chicas. Patrón: la tabla va
 * en `<div className="hidden md:block">` y las tarjetas en
 * `<div className="space-y-3 md:hidden">`.
 */
export default function MobileCard({ header, aside, fields = [], actions, className = "" }: MobileCardProps) {
  return (
    <article
      className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{header}</div>
        {aside && <div className="flex shrink-0 flex-col items-end gap-1">{aside}</div>}
      </div>

      {fields.length > 0 && (
        <dl className="mt-3 space-y-2 text-theme-sm text-gray-600 dark:text-gray-300">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center justify-between gap-3">
              <dt className="shrink-0 text-gray-400">{field.label}</dt>
              <dd className="flex min-w-0 justify-end text-right">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && (
        <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
          {actions}
        </div>
      )}
    </article>
  );
}
