import { Auth } from "@/lib/auth/auth";
import type { AuthProvider } from "@/lib/auth/auth.port";
import { ApiHandlerFactory, type ApiHandlerDeps } from "./apiHandler";
import { PanelApiHandlerFactory } from "./panelApiHandler";

function create(getProvider: () => AuthProvider = Auth.provider, deps?: ApiHandlerDeps) {
  return PanelApiHandlerFactory.create("admin", getProvider, deps);
}

/**
 * Wraps a route handler for `/api/admin/**` (except session sign-in/sign-out).
 *
 * Flow: read session cookie → authenticate admin → parse params/query/body with Zod → run handler → map errors → `{ ok, data | error }` envelope.
 *
 * Handler `ctx`: `actor` (signed-in admin), `repos` (`AppRepos`), `transaction(work)`, `params` / `query` / `body` (typed from options schemas), `request`, `requestId`.
 *
 * Options: `route` (log label), `fallbackError` (Spanish 500 message), optional `paramsSchema`, `querySchema`, `bodySchema`.
 *
 * Return: plain value (`200`), `HandlerResults.created` / `.page` / `.noContent`, or `Response` (cookies). Export `runtime = "nodejs"` on the route module.
 *
 * Sign-in and sign-out use {@link PublicApiHandler} instead.
 */
export const AdminApiHandler = create();

/** Same as admin handler but requires `institution_staff` role (future `/api/institucion/**`). */
export const InstitutionStaffApiHandler = PanelApiHandlerFactory.create("institution_staff");

/**
 * Unauthenticated routes (`POST`/`DELETE /api/admin/sessions`). `ctx.actor` is `null`.
 * Call `ctx.setAuditContext` after sign-in so audit rows record the new user.
 */
export const PublicApiHandler = ApiHandlerFactory.create<null>(async () => null);

export const AdminApiHandlerFactory = { create };
