"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import { AdminSession } from "@/frontend/gateway/session";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";

const UNAUTHORIZED_STATUS = 401;

/**
 * Page guards only run on navigation, so an expired session surfaces first as an API 401.
 * Signing out before redirecting drops the cookie; otherwise a cookie the pages still accept
 * would bounce the browser between the panel and `/admin/login`.
 */
export function useUnauthorizedRedirect() {
  const router = useRouter();
  return useCallback(
    async (result: ApiResult<unknown>) => {
      if (result.ok || result.status !== UNAUTHORIZED_STATUS) return;
      await AdminSession.signOut();
      router.replace(AdminRoutes.login);
    },
    [router],
  );
}
