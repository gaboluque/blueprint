import { SessionCookie } from "@/lib/auth/sessionCookie";
import { buildAdminActor } from "../../../../factories/models";

const VALID_TOKEN = "valid-token";

/** `jest.mock("@/lib/auth/auth", ...)` factory: only `VALID_TOKEN` authenticates. */
function authModule() {
  return {
    Auth: {
      provider: () => ({
        signIn: jest.fn(),
        authenticate: async (_users: unknown, token: string) => (token === VALID_TOKEN ? buildAdminActor() : null),
      }),
    },
  };
}

/** `jest.mock("@/lib/db/client", ...)` factory: repos get an inert db; `transaction` runs work inline. */
function dbClientModule() {
  const db = { transaction: jest.fn((work: (tx: unknown) => unknown) => work({})) };
  return { Database: { get: () => db, close: jest.fn() } };
}

function request(
  path: string,
  { method = "GET", body, token = VALID_TOKEN }: { method?: string; body?: unknown; token?: string | null } = {},
): Request {
  const headers = new Headers();
  if (token) headers.set("cookie", `${SessionCookie.name}=${token}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function context(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

export const AdminRouteKit = { authModule, dbClientModule, request, context };
