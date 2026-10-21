import { apiFetch } from "./api";
import type { PaginatedResult } from "./pagination";

/** Only for complete catalogs needed by dependency editors/selectors. */
export async function apiFetchCollection<T>(path: string): Promise<T[]> {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("pageSize", "100");
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    params.set("page", String(page));
    const result = await apiFetch<PaginatedResult<T>>(`${pathname}?${params}`);
    items.push(...result.data);
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  return items;
}
