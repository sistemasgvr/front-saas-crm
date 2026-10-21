"use client";

import { useState } from "react";

/** Para catálogos ya cargados completos. Filtrar y ordenar antes de paginar. */
export function useClientPagination<T>(items: T[], pageSize = 20, resetKey = "") {
  const [selection, setSelection] = useState({ page: 1, resetKey });
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = selection.resetKey === resetKey
    ? Math.min(selection.page, totalPages)
    : 1;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages,
      onPageChange: (next: number) => setSelection({
        page: Math.max(1, Math.min(next, totalPages)), resetKey,
      }),
    },
  };
}
