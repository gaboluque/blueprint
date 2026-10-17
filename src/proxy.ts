import { NextResponse, type NextRequest } from "next/server";
import { AdminPageAccess } from "@/app/(client)/admin/_lib/adminPageAccess";
import { AdminSessionResolver } from "@/app/(client)/admin/_lib/adminSessionResolver";
import { SessionCookie } from "@/lib/auth/sessionCookie";

/** Page access for `/admin/**`. `/api` stays with `AdminApiHandler`. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SessionCookie.name)?.value;
  const admin = await AdminSessionResolver.resolve(token);
  const decision = AdminPageAccess.decide({
    pathname: request.nextUrl.pathname,
    hasSessionCookie: Boolean(token),
    signedIn: admin !== null,
  });

  const response = decision.redirectTo
    ? NextResponse.redirect(new URL(decision.redirectTo, request.url))
    : NextResponse.next();
  if (decision.clearSessionCookie) SessionCookie.clear(response);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
