import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import type { Actor } from "@/lib/auth/actor";
import { Policy } from "@/lib/policy/policy";

export type AdminPageAccessInput = {
  pathname: string;
  hasSessionCookie: boolean;
  actor: Actor | null;
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
function decide({ pathname, hasSessionCookie, actor }: AdminPageAccessInput): AdminPageDecision {
  const isAdmin = Policy.isAdmin(actor);
  const clearSessionCookie = hasSessionCookie && actor === null;
  if (isLoginPath(pathname)) return { redirectTo: isAdmin ? AdminRoutes.home : null, clearSessionCookie };
  return { redirectTo: isAdmin ? null : AdminRoutes.login, clearSessionCookie };
}

export const AdminPageAccess = { decide };
