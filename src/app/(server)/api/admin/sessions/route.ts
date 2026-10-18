import { NextResponse } from "next/server";
import { UserView } from "@/domains/users/views/user.view";
import { Auth } from "@/lib/auth/auth";
import { signInBodySchema } from "@/lib/auth/auth.validation";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { UnauthorizedError } from "@/lib/errors/domain.errors";
import { HttpError } from "@/lib/errors/http.errors";
import { PublicApiHandler } from "@/lib/http/adminApiHandler";
import { ApiResponse } from "@/lib/http/apiResponse";
import { RateLimiter } from "@/lib/http/rateLimiter";

export const runtime = "nodejs";

const INVALID_CREDENTIALS_MESSAGE = "Incorrect email or password.";
const TOO_MANY_ATTEMPTS_MESSAGE = "Too many attempts. Try again in a minute.";
const SIGN_IN_RATE_LIMIT = { limit: 5, windowMs: 60_000 };

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const POST = PublicApiHandler(
  async ({ request, body, repos, requestId, setAuditContext }) => {
    const rateLimitKey = `sign-in:${clientIp(request)}:${body.email}`;
    if (!RateLimiter.consume(rateLimitKey, SIGN_IN_RATE_LIMIT)) throw new HttpError(TOO_MANY_ATTEMPTS_MESSAGE, 429);

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
    fallbackError: "We couldn't sign you in.",
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
  { route: "DELETE /api/admin/sessions", fallbackError: "We couldn't sign you out." },
);
