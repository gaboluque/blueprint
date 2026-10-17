import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";

export type AdminPageAccessInput = {
  pathname: string;
  hasSessionCookie: boolean;
  signedIn: boolean;
};

export type AdminPageDecision = {
  redirectTo: string | null;
  /** A cookie that doesn't resolve to an admin is dropped so every later check agrees it's signed out. */
  clearSessionCookie: boolean;
};

function isLoginPath(pathname: string): boolean {
  return pathname === AdminRoutes.login || pathname.startsWith(`${AdminRoutes.login}/`);
}

/** Login is the only `/admin/**` page open to signed-out visitors; signed-in admins skip it. */
function decide({ pathname, hasSessionCookie, signedIn }: AdminPageAccessInput): AdminPageDecision {
  const clearSessionCookie = hasSessionCookie && !signedIn;
  if (isLoginPath(pathname)) return { redirectTo: signedIn ? AdminRoutes.home : null, clearSessionCookie };
  return { redirectTo: signedIn ? null : AdminRoutes.login, clearSessionCookie };
}

export const AdminPageAccess = { decide };
