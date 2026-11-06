"use client";

import { Icon } from "@/src/components/ui/Icon";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
  compact?: boolean;
}

function pageNumbers(page: number, totalPages: number): (number | "…")[] {
  const numeros: (number | "…")[] = [1];
  const izquierda = Math.max(2, page - 1);
  const derecha = Math.min(totalPages - 1, page + 1);

  if (izquierda > 2) numeros.push("…");
  for (let i = izquierda; i <= derecha; i++) numeros.push(i);
  if (derecha < totalPages - 1) numeros.push("…");
  if (totalPages > 1) numeros.push(totalPages);

  return numeros;
}

export default function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  itemLabel = "resultados",
  className = "",
  compact = false,
}: PaginationProps) {
  if (total === 0) return null;

  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  // Variante de una sola fila para paneles estrechos (p. ej. lista de chats).
  if (compact) {
    const navBtn =
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/[0.05]";
    return (
      <div data-tour="pagination" className={`flex items-center justify-between gap-2 ${className}`}>
        <p className="min-w-0 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {desde}–{hasta}
          </span>{" "}
          de <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> {itemLabel}
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className={navBtn}
          >
            <Icon name="mdi:chevron-left" size={18} />
          </button>
          <span className="whitespace-nowrap px-1 text-theme-xs tabular-nums text-gray-600 dark:text-gray-300">
            {page}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
            className={navBtn}
          >
            <Icon name="mdi:chevron-right" size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Botones y números: estilo de tables/Pagination.tsx del template TailAdmin.
  const navBtn =
    "flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]";

  return (
    <div data-tour="pagination"
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-center text-theme-xs text-gray-500 dark:text-gray-400 sm:text-start sm:text-theme-sm">
        Mostrando <span className="font-medium text-gray-700 dark:text-gray-300">{desde}</span>–
        <span className="font-medium text-gray-700 dark:text-gray-300">{hasta}</span> de{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> {itemLabel}
      </p>

      <div className="flex items-center justify-center sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`mr-2.5 ${navBtn}`}
        >
          Anterior
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          {pageNumbers(page, totalPages).map((p, idx) =>
            p === "…" ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-700 dark:text-gray-400">
                ...
              </span>
            ) : (
              <button
                type="button"
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                  p === page
                    ? "bg-brand-500 text-white"
                    : "text-gray-700 hover:bg-blue-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-sm text-gray-700 dark:text-gray-400 sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`ml-2.5 ${navBtn}`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
