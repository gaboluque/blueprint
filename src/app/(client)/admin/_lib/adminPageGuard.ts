import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import type { Actor } from "@/lib/auth/actor";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { Policy } from "@/lib/policy/policy";
import { AdminSessionResolver } from "./adminSessionResolver";

/** Fail-closed backstop behind `proxy.ts`; also supplies the admin to the panel layout. */
const requireAdmin = cache(async (): Promise<Actor> => {
  const actor = await AdminSessionResolver.resolve((await cookies()).get(SessionCookie.name)?.value);
  if (!actor || !Policy.isAdmin(actor)) redirect(AdminRoutes.login);
  return actor;
});

export const AdminPageGuard = { requireAdmin };
