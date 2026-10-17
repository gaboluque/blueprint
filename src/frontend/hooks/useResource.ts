"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import { useUnauthorizedRedirect } from "./useUnauthorizedRedirect";

type Loader<T> = () => Promise<ApiResult<T>>;
type Snapshot<T> = { load: Loader<T>; request: number; result: ApiResult<T> };

/** Loads one resource. `load` must be stable (module function or `useCallback`); a new `load` refetches. */
export function useResource<T>(load: Loader<T>) {
  const [request, setRequest] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const onUnauthorized = useUnauthorizedRedirect();

  useEffect(() => {
    let cancelled = false;
    load().then((result) => {
      if (cancelled) return;
      void onUnauthorized(result);
      setSnapshot({ load, request, result });
    });
    return () => {
      cancelled = true;
    };
  }, [load, request, onUnauthorized]);

  const reload = useCallback(() => setRequest((value) => value + 1), []);
  const replace = useCallback(
    (data: T) => setSnapshot((previous) => previous && { ...previous, result: { ok: true, data } }),
    [],
  );

  const current = snapshot?.load === load ? snapshot : null;
  const isLoading = current?.request !== request;

  return {
    data: current?.result.ok ? current.result.data : null,
    error: !isLoading && current && !current.result.ok ? current.result.error : null,
    isLoading,
    reload,
    /** Swaps in a mutation response without refetching. */
    replace,
  };
}
