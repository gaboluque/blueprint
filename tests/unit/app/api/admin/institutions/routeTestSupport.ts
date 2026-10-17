import type { AuthProvider } from "@/lib/auth/auth.port";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import type { DbExecutor } from "@/lib/db/client";
import { buildAdminActor } from "../../../../../factories/models";

const VALID_TOKEN = "valid-token";

function authProvider(): AuthProvider {
  return {
    signIn: jest.fn(),
    authenticate: jest.fn(async (_users, token: string) => (token === VALID_TOKEN ? buildAdminActor() : null)),
  };
}

/** Repos are built on it but never queried: services are mocked. `transaction` runs work on the same fake. */
function fakeDb(): DbExecutor & { transaction: jest.Mock } {
  const db = { transaction: jest.fn() };
  db.transaction.mockImplementation((work: (tx: unknown) => Promise<unknown>) => work(db));
  return db as unknown as DbExecutor & { transaction: jest.Mock };
}

function request(
  path: string,
  { method = "GET", body, signedIn = true }: { method?: string; body?: unknown; signedIn?: boolean } = {},
): Request {
  const headers = new Headers();
  if (signedIn) headers.set("cookie", `${SessionCookie.name}=${VALID_TOKEN}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function routeContext(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

export const RouteTestSupport = { authProvider, fakeDb, request, routeContext };
