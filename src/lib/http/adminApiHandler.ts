import { Auth } from "@/lib/auth/auth";
import type { AuthProvider } from "@/lib/auth/auth.port";
import { ApiHandlerFactory, type ApiHandlerDeps } from "./apiHandler";
import { PanelApiHandlerFactory } from "./panelApiHandler";

function create(getProvider: () => AuthProvider = Auth.provider, deps?: ApiHandlerDeps) {
  return PanelApiHandlerFactory.create("admin", getProvider, deps);
}

/** Every `/api/admin/**` route except sign-in/sign-out. `ctx.actor` is the signed-in admin. */
export const AdminApiHandler = create();

/** Institution staff routes (future `/api/institucion/**`). */
export const InstitutionStaffApiHandler = PanelApiHandlerFactory.create("institution_staff");

/** Unauthenticated routes (sign-in/sign-out). `ctx.actor` is `null`. */
export const PublicApiHandler = ApiHandlerFactory.create<null>(async () => null);

export const AdminApiHandlerFactory = { create };
