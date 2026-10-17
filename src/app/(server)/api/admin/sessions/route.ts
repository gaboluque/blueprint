import { NextResponse } from "next/server";
import { UserView } from "@/domains/users/views/user.view";
import { Auth } from "@/lib/auth/auth";
import { signInBodySchema } from "@/lib/auth/auth.validation";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { UnauthorizedError } from "@/lib/errors/domain.errors";
import { PublicApiHandler } from "@/lib/http/adminApiHandler";
import { ApiResponse } from "@/lib/http/apiResponse";

export const runtime = "nodejs";

const INVALID_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";

export const POST = PublicApiHandler(
  async ({ body, repos, requestId, setAuditContext }) => {
    const session = await Auth.provider().signIn(repos, body);
    if (!session || session.actor.role !== "admin") throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

    setAuditContext({ actor: session.actor, requestId });
    await repos.audit.record({
      entityType: "user",
      verb: "signed_in",
      entityId: session.actor.id,
    });

    const response = ApiResponse.created(UserView.format(session.actor));
    SessionCookie.set(response, session.token, session.expiresAt);
    return response;
  },
  {
    route: "POST /api/admin/sessions",
    fallbackError: "No pudimos iniciar sesión.",
    bodySchema: signInBodySchema,
  },
);

/** Public so an expired session can still be cleared client-side; logs only when the cookie still resolves. */
export const DELETE = PublicApiHandler(
  async ({ request, repos, requestId, setAuditContext }) => {
    const token = SessionCookie.read(request);
    const actor = token ? await Auth.provider().authenticate(repos, token) : null;
    if (actor) {
      setAuditContext({ actor, requestId });
      await repos.audit.record({
        entityType: "user",
        verb: "signed_out",
        entityId: actor.id,
      });
    }

    const response = new NextResponse(null, { status: 204 });
    SessionCookie.clear(response);
    return response;
  },
  { route: "DELETE /api/admin/sessions", fallbackError: "No pudimos cerrar la sesión." },
);
