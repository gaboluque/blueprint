"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import type { ListQuery } from "@/frontend/components/shared/listTypes";
import type { PaginationMeta } from "@/lib/pagination";
import { useUnauthorizedRedirect } from "./useUnauthorizedRedirect";

type ListFetcher<T, Q> = (query: Q) => Promise<ApiResult<T[]>>;
type Snapshot<T, Q> = { fetch: ListFetcher<T, Q>; query: Q; request: number; result: ApiResult<T[]> };

const PAGING_KEYS: ReadonlySet<string> = new Set(["page", "pageSize"]);

/** Paginated list state. `fetch` must be stable (module function or `useCallback`). */
export function useListQuery<T, Q extends ListQuery>({
  initialQuery,
  fetch,
}: {
  initialQuery: Q;
  fetch: ListFetcher<T, Q>;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [request, setRequest] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T, Q> | null>(null);
  const [lastPagination, setLastPagination] = useState<PaginationMeta | null>(null);
  const onUnauthorized = useUnauthorizedRedirect();

  useEffect(() => {
    let cancelled = false;
    fetch(query).then((result) => {
      if (cancelled) return;
      void onUnauthorized(result);
      setSnapshot({ fetch, query, request, result });
      if (result.ok && result.pagination) setLastPagination(result.pagination);
    });
    return () => {
      cancelled = true;
    };
  }, [fetch, query, request, onUnauthorized]);

  /** Changing a filter jumps back to the first page. */
  const patchQuery = useCallback((partial: Partial<Q>) => {
    const resetsPage = Object.keys(partial).some((key) => !PAGING_KEYS.has(key));
    setQuery((previous) => ({ ...previous, ...partial, ...(resetsPage ? { page: 1 } : {}) }));
  }, []);

  const refetch = useCallback(() => setRequest((value) => value + 1), []);

  const isCurrent = snapshot?.fetch === fetch && snapshot.query === query && snapshot.request === request;
  const result = snapshot?.fetch === fetch ? snapshot.result : null;

  return {
    data: result?.ok ? result.data : [],
    query,
    patchQuery,
    pagination: lastPagination ?? { page: query.page, pageSize: query.pageSize, total: 0 },
    isLoading: !isCurrent,
    hasLoadedOnce: result?.ok === true,
    error: isCurrent && result && !result.ok ? result.error : null,
    refetch,
  };
}
