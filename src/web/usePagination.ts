// Pagination côté client d'une liste déjà filtrée/triée (CLP web/src/admin/lib/usePagination.ts), reprise telle quelle.
import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export interface PaginationState<T> {
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  pageCount: number;
  total: number;
  /** Index (1-based) du premier / dernier élément affiché ; 0 si la liste est vide. */
  from: number;
  to: number;
  pageItems: T[];
}

/** `resetKey` change (filtre, recherche, onglet…) : retour page 1. */
export function usePagination<T>(items: T[], opts: { pageSize?: number; resetKey?: unknown } = {}): PaginationState<T> {
  const [pageSize, setPageSizeState] = useState(opts.pageSize ?? 25);
  const [page, setPageState] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => { setPageState(1); }, [opts.resetKey]);
  const current = Math.min(page, pageCount);

  const pageItems = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return {
    page: current, setPage: (p) => setPageState(Math.min(Math.max(1, p), pageCount)),
    pageSize, setPageSize: (n) => { setPageSizeState(n); setPageState(1); },
    pageCount, total, from, to, pageItems,
  };
}
