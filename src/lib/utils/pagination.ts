import type { PaginatedResult } from "@/lib/data/types";
import { PAGE_SIZE } from "@/lib/constants/brazil";

export function paginate<T>(
  items: T[],
  page: number,
  pageSize = PAGE_SIZE
): PaginatedResult<T> {
  const safePage = Math.max(1, page || 1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(safePage, totalPages);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: current,
    pageSize,
    totalPages,
  };
}

export function parsePage(value?: string | number | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}
