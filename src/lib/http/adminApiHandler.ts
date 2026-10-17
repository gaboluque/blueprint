import type { Actor } from "@/lib/auth/actor";
import { Auth } from "@/lib/auth/auth";
import type { AuthProvider } from "@/lib/auth/auth.port";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { UnauthorizedError } from "@/lib/errors/domain.errors";
import { ApiHandlerFactory, type ApiHandlerDeps } from "./apiHandler";

const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Inicia sesión de nuevo.";

function create(getProvider: () => AuthProvider = Auth.provider, deps?: ApiHandlerDeps) {
  return ApiHandlerFactory.create<Actor>(async (request, repos) => {
    const token = SessionCookie.read(request);
    if (!token) throw new UnauthorizedError();
    const actor = await getProvider().authenticate(repos.users, token);
    if (!actor) throw new UnauthorizedError(SESSION_EXPIRED_MESSAGE);
    return actor;
  }, deps);
}

/** Every `/api/admin/**` route except sign-in/sign-out. `ctx.actor` is the signed-in admin. */
export const AdminApiHandler = create();

/** Unauthenticated routes (sign-in/sign-out). `ctx.actor` is `null`. */
export const PublicApiHandler = ApiHandlerFactory.create<null>(async () => null);

export const AdminApiHandlerFactory = { create };
