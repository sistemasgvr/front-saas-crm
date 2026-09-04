import { Skeleton } from "@/src/components/ui/Skeleton";

/** Fila de lista compacta (avatar + 2 líneas). */
export function ListItemSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800" role="status" aria-label="Cargando">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-3/4 max-w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Grid de KPI cards (mismo layout que KpiCard). */
export function KpiCardsSkeleton({ count = 4, className = "mb-4" }: { count?: number; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3 ${className}`}
      role="status"
      aria-label="Cargando indicadores"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Panel de gráfico con borde. */
export function ChartPanelSkeleton({
  heightClass = "h-[260px]",
  title = true,
}: {
  heightClass?: string;
  title?: boolean;
}) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03]"
      role="status"
      aria-label="Cargando gráfico"
    >
      {title ? <Skeleton className="mb-3 h-4 w-36" /> : null}
      <Skeleton className={`w-full rounded-lg ${heightClass}`} />
    </div>
  );
}

/** Bloque embudo: KPIs + 2 paneles. */
export function EmbudoSkeleton() {
  return (
    <section className="mb-6" role="status" aria-label="Cargando embudo">
      <Skeleton className="mb-3 h-4 w-40" />
      <KpiCardsSkeleton count={4} className="mb-3" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartPanelSkeleton />
        <ChartPanelSkeleton />
      </div>
    </section>
  );
}

/** Fila de tabla genérica. */
export function TableRowsSkeleton({
  rows = 8,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      role="status"
      aria-label="Cargando tabla"
    >
      <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 gap-4">
              {Array.from({ length: cols - 1 }).map((_, c) => (
                <Skeleton
                  key={c}
                  className={`h-3.5 ${c === 0 ? "w-28" : c === 1 ? "w-24" : "w-16"}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cards móviles (leads / listas). */
export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando lista">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista + tabla responsive (leads / inmuebles). */
export function TablePageSkeleton({
  rows = 8,
  cols = 6,
  showMobileCards = true,
}: {
  rows?: number;
  cols?: number;
  showMobileCards?: boolean;
}) {
  return (
    <>
      {showMobileCards ? (
        <div className="md:hidden">
          <CardListSkeleton count={4} />
        </div>
      ) : null}
      <div className={showMobileCards ? "hidden md:block" : undefined}>
        <TableRowsSkeleton rows={rows} cols={cols} />
      </div>
    </>
  );
}

/** Tablero kanban. */
export function KanbanBoardSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div
      className="thin-scrollbar flex gap-3 overflow-x-auto pb-2"
      role="status"
      aria-label="Cargando tablero"
    >
      {Array.from({ length: columns }).map((_, col) => (
        <div
          key={col}
          className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50/80 p-2 dark:border-gray-800 dark:bg-white/[0.02]"
        >
          <div className="mb-2 flex items-center justify-between px-1 py-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, card) => (
              <div
                key={card}
                className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <Skeleton className="mb-2 h-3.5 w-36" />
                <Skeleton className="mb-2 h-3 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Ficha detalle (lead / inmueble). */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando detalle">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3.5 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <Skeleton className="mb-3 h-4 w-28" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <Skeleton className="mb-3 h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-3/4 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <Skeleton className="mb-3 h-4 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Calendario agenda. */
export function CalendarSkeleton() {
  return (
    <div className="min-h-[28rem] p-2 sm:min-h-[32rem] sm:p-3" role="status" aria-label="Cargando agenda">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-36" />
        <div className="hidden gap-2 sm:flex">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-6 w-full rounded" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md sm:h-16" />
        ))}
      </div>
    </div>
  );
}

/** Modal / panel compacto de detalle. */
export function DetailModalSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Cargando">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3.5 w-full max-w-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
