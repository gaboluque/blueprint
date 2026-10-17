import { POST as signInRoute } from "@/app/(server)/api/admin/sessions/route";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { INTEGRATION_ADMIN } from "@tests/integration/factories/user.factory";

function request(
  path: string,
  {
    method = "GET",
    body,
    cookie,
  }: { method?: string; body?: unknown; cookie?: string } = {},
): Request {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function signInAsAdmin(): Promise<{ cookie: string }> {
  const response = await signInRoute(
    request("/api/admin/sessions", {
      method: "POST",
      body: { email: INTEGRATION_ADMIN.email, password: INTEGRATION_ADMIN.password },
    }),
  );
  if (response.status !== 201) {
    const json = await response.json().catch(() => ({}));
    throw new Error(`Sign-in failed (${response.status}): ${JSON.stringify(json)}`);
  }
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie?.startsWith(`${SessionCookie.name}=`)) {
    throw new Error("Expected session Set-Cookie header");
  }
  return { cookie: setCookie.split(";")[0] ?? "" };
}

function routeContext(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

export const IntegrationRoute = { request, signInAsAdmin, routeContext };
