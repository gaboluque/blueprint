import type { Actor } from "@/lib/auth/actor";
import { Auth } from "@/lib/auth/auth";
import type { AuthProvider } from "@/lib/auth/auth.port";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import type { UserRole } from "@/lib/db/schema";
import { UnauthorizedError } from "@/lib/errors/domain.errors";
import { ApiHandlerFactory, type ApiHandlerDeps } from "./apiHandler";

const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Inicia sesión de nuevo.";

function create(requiredRole: UserRole, getProvider: () => AuthProvider = Auth.provider, deps?: ApiHandlerDeps) {
  return ApiHandlerFactory.create<Actor>(async (request, repos) => {
    const token = SessionCookie.read(request);
    if (!token) throw new UnauthorizedError();
    const actor = await getProvider().authenticate(repos, token);
    if (!actor) throw new UnauthorizedError(SESSION_EXPIRED_MESSAGE);
    if (actor.role !== requiredRole) throw new UnauthorizedError(SESSION_EXPIRED_MESSAGE);
    return actor;
  }, deps);
}

export const PanelApiHandlerFactory = { create };
