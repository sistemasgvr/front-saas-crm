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
}: PaginationProps) {
  if (total === 0) return null;

  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-center text-theme-xs text-gray-500 dark:text-gray-400 sm:text-start sm:text-theme-sm">
        Mostrando <span className="font-medium text-gray-700 dark:text-gray-300">{desde}</span>–
        <span className="font-medium text-gray-700 dark:text-gray-300">{hasta}</span> de{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> {itemLabel}
      </p>

      <div className="flex items-center justify-center gap-1 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          <Icon name="mdi:chevron-left" size={18} />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers(page, totalPages).map((p, idx) =>
            p === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 w-9 items-center justify-center text-theme-sm text-gray-400"
              >
                …
              </span>
            ) : (
              <button
                type="button"
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-theme-sm font-medium ${
                  p === page
                    ? "bg-brand-500 text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-theme-sm text-gray-600 dark:text-gray-300 sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          <Icon name="mdi:chevron-right" size={18} />
        </button>
      </div>
    </div>
  );
}
