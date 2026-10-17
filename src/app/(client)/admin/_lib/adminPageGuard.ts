import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import type { Actor } from "@/lib/auth/actor";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { AdminSessionResolver } from "./adminSessionResolver";

/** Fail-closed backstop behind `proxy.ts`; also supplies the admin to the panel layout. */
async function requireAdmin(): Promise<Actor> {
  const admin = await AdminSessionResolver.resolve((await cookies()).get(SessionCookie.name)?.value);
  if (!admin) redirect(AdminRoutes.login);
  return admin;
}

export const AdminPageGuard = { requireAdmin };
