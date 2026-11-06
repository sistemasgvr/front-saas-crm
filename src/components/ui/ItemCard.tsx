import type { ReactNode } from "react";
import { Icon } from "@/src/components/ui/Icon";

interface ItemCardProps {
  title: string;
  /** Icono Iconify en un recuadro, como las métricas del template. */
  icon?: string;
  /** Badges bajo el título (tipo, estado). */
  badges?: ReactNode;
  /** Arriba a la derecha: acciones (TableAction) o un badge de estado. */
  aside?: ReactNode;
  description?: ReactNode;
  /** Pie con borde superior: botones o datos cortos (contadores). */
  footer?: ReactNode;
  /** Selector `data-tour` para los recorridos guiados. */
  dataTour?: string;
}

/**
 * Tarjeta de una grilla de elementos (roles, recorridos…). Estilo de las
 * tarjetas del template TailAdmin: rounded-2xl, borde gris, fondo
 * white/[0.03] en oscuro. Agrúpalas con `grid gap-4 md:grid-cols-2 xl:grid-cols-3`.
 */
export default function ItemCard({ title, icon, badges, aside, description, footer, dataTour }: ItemCardProps) {
  return (
    <article
      data-tour={dataTour}
      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Icon name={icon} size={20} className="text-gray-800 dark:text-white/90" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold text-gray-800 dark:text-white/90" title={title}>
              {title}
            </h3>
            {badges && <div className="mt-1.5 flex flex-wrap gap-1.5">{badges}</div>}
          </div>
        </div>
        {aside && <div className="flex shrink-0 items-center gap-1">{aside}</div>}
      </div>

      {description && <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}

      <div className="flex-1" />

      {footer && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          {footer}
        </div>
      )}
    </article>
  );
}
