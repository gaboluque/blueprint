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
  async ({ body, repos }) => {
    const session = await Auth.provider().signIn(repos.users, body);
    if (!session) throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

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

export const DELETE = PublicApiHandler(
  async () => {
    const response = new NextResponse(null, { status: 204 });
    SessionCookie.clear(response);
    return response;
  },
  { route: "DELETE /api/admin/sessions", fallbackError: "No pudimos cerrar la sesión." },
);
