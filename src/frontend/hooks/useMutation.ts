"use client";

import { useCallback, useState } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import type { FieldErrors } from "@/lib/errors/domain.errors";
import { useUnauthorizedRedirect } from "./useUnauthorizedRedirect";

type MutationOptions = {
  /** Off for sign-in, where `401` means wrong credentials rather than an expired session. */
  redirectOnUnauthorized?: boolean;
};

type MutationState = { pending: boolean; error: string | null; fieldErrors: FieldErrors };

const IDLE: MutationState = { pending: false, error: null, fieldErrors: {} };

export function useMutation<I, T>(action: (input: I) => Promise<ApiResult<T>>, options: MutationOptions = {}) {
  const { redirectOnUnauthorized = true } = options;
  const [state, setState] = useState<MutationState>(IDLE);
  const onUnauthorized = useUnauthorizedRedirect();

  const run = useCallback(
    async (input: I): Promise<ApiResult<T>> => {
      setState({ ...IDLE, pending: true });
      const result = await action(input);
      if (redirectOnUnauthorized) void onUnauthorized(result);
      setState(result.ok ? IDLE : { pending: false, error: result.error, fieldErrors: result.fieldErrors ?? {} });
      return result;
    },
    [action, onUnauthorized, redirectOnUnauthorized],
  );

  const reset = useCallback(() => setState(IDLE), []);

  return { ...state, run, reset };
}
