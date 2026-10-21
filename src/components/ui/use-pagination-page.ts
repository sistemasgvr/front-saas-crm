"use client";

import { useState } from "react";

/** Changing the resource or filters starts its list at page one. */
export function usePaginationPage(resetKey: string) {
  const [selection, setSelection] = useState({ key: resetKey, page: 1 });
  const page = selection.key === resetKey ? selection.page : 1;
  const setPage = (next: number) => setSelection({ key: resetKey, page: next });
  return [page, setPage] as const;
}
