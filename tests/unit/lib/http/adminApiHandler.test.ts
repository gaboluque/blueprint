import { z } from "zod";
import { InstitutionErrors } from "@/domains/institutions/institution.errors";
import type { AuthProvider } from "@/lib/auth/auth.port";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import type { DbExecutor } from "@/lib/db/client";
import { RepoRegistry } from "@/lib/db/repoRegistry";
import { AdminApiHandlerFactory } from "@/lib/http/adminApiHandler";
import { HandlerResults } from "@/lib/http/handlerResults";
import { ErrorReporter } from "@/lib/observability/errorReporter";
import type { Logger } from "@/lib/observability/logger";
import { paginationQuerySchema } from "@/lib/pagination";
import { idParamsSchema } from "@/lib/validation/schemas";
import { buildAdminActor, buildInstitutionStaffActor, INSTITUTION_ID } from "../../../factories/models";

const VALID_TOKEN = "valid-token";
const OPTIONS = { route: "TEST /api/admin/things", fallbackError: "No pudimos completar la solicitud." };
const bodySchema = z.strictObject({ name: z.string().min(1) });

function makeLogger(): jest.Mocked<Logger> {
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn((_bindings: Record<string, unknown>) => logger),
  };
  return logger;
}

function setup() {
  const provider: AuthProvider = {
    signIn: jest.fn(),
    authenticate: jest.fn(async (_users, token: string) => (token === VALID_TOKEN ? buildAdminActor() : null)),
  };
  const logger = makeLogger();
  // Repos are never queried here: auth is faked and handlers don't touch the db.
  const registry = new RepoRegistry({} as DbExecutor);
  const AdminApiHandler = AdminApiHandlerFactory.create(() => provider, { createRegistry: () => registry, logger });
  return { AdminApiHandler, logger, registry };
}

function makeRequest(
  path: string,
  { method = "GET", body, token }: { method?: string; body?: unknown; token?: string } = {},
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

const routeContext = (params: Record<string, string>) => ({ params: Promise.resolve(params) });

describe("AdminApiHandler", () => {
  it("returns 401 without a session cookie and never runs the handler", async () => {
    const { AdminApiHandler } = setup();
    const handler = jest.fn();
    const route = AdminApiHandler(handler, OPTIONS);

    const response = await route(makeRequest("/api/admin/things"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Debes iniciar sesión." });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 when the provider rejects the session token", async () => {
    const { AdminApiHandler } = setup();
    const route = AdminApiHandler(async () => ({}), OPTIONS);

    const response = await route(makeRequest("/api/admin/things", { token: "forged" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo." });
  });

  it("returns 401 for a valid institution staff session", async () => {
    const provider: AuthProvider = {
      signIn: jest.fn(),
      authenticate: jest.fn(async () => buildInstitutionStaffActor()),
    };
    const logger = makeLogger();
    const registry = new RepoRegistry({} as DbExecutor);
    const AdminApiHandler = AdminApiHandlerFactory.create(() => provider, { createRegistry: () => registry, logger });
    const handler = jest.fn();
    const route = AdminApiHandler(handler, OPTIONS);

    const response = await route(makeRequest("/api/admin/things", { token: VALID_TOKEN }));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("authenticates before reading the body", async () => {
    const { AdminApiHandler } = setup();
    const route = AdminApiHandler(async () => ({}), { ...OPTIONS, bodySchema });

    const response = await route(makeRequest("/api/admin/things", { method: "POST", body: { name: 42 } }));

    expect(response.status).toBe(401);
  });

  it("passes the actor and parsed params, query, and body to the handler", async () => {
    const { AdminApiHandler } = setup();
    const handler = jest.fn(async () => ({ done: true }));
    const route = AdminApiHandler(handler, {
      ...OPTIONS,
      paramsSchema: idParamsSchema,
      querySchema: paginationQuerySchema,
      bodySchema,
    });

    const response = await route(
      makeRequest("/api/admin/things?page=2", { method: "PATCH", body: { name: "Nueva" }, token: VALID_TOKEN }),
      routeContext({ id: INSTITUTION_ID }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { done: true } });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: buildAdminActor(),
        params: { id: INSTITUTION_ID },
        query: { page: 2, pageSize: 20 },
        body: { name: "Nueva" },
      }),
    );
  });

  it("returns 400 with field errors when params are invalid", async () => {
    const { AdminApiHandler } = setup();
    const handler = jest.fn();
    const route = AdminApiHandler(handler, { ...OPTIONS, paramsSchema: idParamsSchema });

    const response = await route(makeRequest("/api/admin/things/x", { token: VALID_TOKEN }), routeContext({ id: "x" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toMatchObject({ ok: false, error: "Revisa los datos enviados." });
    expect(Object.keys(json.fieldErrors)).toEqual(["id"]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 400 naming each unknown body key", async () => {
    const { AdminApiHandler } = setup();
    const route = AdminApiHandler(async () => ({}), { ...OPTIONS, bodySchema });

    const response = await route(
      makeRequest("/api/admin/things", {
        method: "POST",
        body: { name: "Ok", status: "archived" },
        token: VALID_TOKEN,
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(Object.keys(json.fieldErrors)).toEqual(["status"]);
  });

  it("returns 415 when the body isn't JSON", async () => {
    const { AdminApiHandler } = setup();
    const route = AdminApiHandler(async () => ({}), { ...OPTIONS, bodySchema });
    const request = new Request("http://localhost/api/admin/things", {
      method: "POST",
      headers: { cookie: `${SessionCookie.name}=${VALID_TOKEN}`, "content-type": "text/plain" },
      body: "name=Ok",
    });

    const response = await route(request);

    expect(response.status).toBe(415);
  });

  it("maps domain errors to their status and message, logging them as warnings", async () => {
    const { AdminApiHandler, logger } = setup();
    const route = AdminApiHandler(async () => {
      throw InstitutionErrors.notFound();
    }, OPTIONS);

    const response = await route(makeRequest("/api/admin/things", { token: VALID_TOKEN }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: "No encontramos la institución." });
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 404, err: expect.objectContaining({ name: "NotFoundError" }) }),
      "request_failed",
    );
  });

  it("logs unexpected errors with stack and returns the fallback message", async () => {
    const { AdminApiHandler, logger } = setup();
    const failure = new Error("relation does not exist");
    const route = AdminApiHandler(async () => {
      throw failure;
    }, OPTIONS);

    const response = await route(makeRequest("/api/admin/things", { token: VALID_TOKEN }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: OPTIONS.fallbackError });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        actorId: buildAdminActor().id,
        err: expect.objectContaining({ name: "Error", message: "relation does not exist", stack: expect.any(String) }),
      }),
      "request_failed",
    );
  });

  it("reports unexpected errors to the configured ErrorReporter", async () => {
    const report = jest.fn();
    ErrorReporter.set({ report });
    const { AdminApiHandler } = setup();
    const failure = new Error("relation does not exist");
    const route = AdminApiHandler(async () => {
      throw failure;
    }, OPTIONS);

    await route(makeRequest("/api/admin/things", { token: VALID_TOKEN }));

    expect(report).toHaveBeenCalledWith(failure, expect.objectContaining({ route: OPTIONS.route }));
    ErrorReporter.set({ report: () => {} });
  });

  it("logs one info line per successful request with status, duration, and actorId", async () => {
    const { AdminApiHandler, logger } = setup();
    const route = AdminApiHandler(async () => ({ ok: true }), OPTIONS);

    await route(makeRequest("/api/admin/things", { token: VALID_TOKEN }));

    expect(logger.child).toHaveBeenCalledWith({ requestId: expect.any(String), route: OPTIONS.route, method: "GET" });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, actorId: buildAdminActor().id, durationMs: expect.any(Number) }),
      "request",
    );
  });

  it("mints a server-side x-request-id on success and error, ignoring any inbound header", async () => {
    const { AdminApiHandler } = setup();
    const route = AdminApiHandler(async () => ({}), OPTIONS);
    const spoofed = new Request("http://localhost/api/admin/things", {
      headers: { cookie: `${SessionCookie.name}=${VALID_TOKEN}`, "x-request-id": "attacker-controlled" },
    });

    const ok = await route(spoofed);
    const unauthorized = await route(makeRequest("/api/admin/things"));

    expect(ok.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(ok.headers.get("x-request-id")).not.toBe("attacker-controlled");
    expect(unauthorized.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("sets the audit context from the authenticated actor before the handler runs", async () => {
    const { AdminApiHandler, registry } = setup();
    const setAuditContext = jest.spyOn(registry, "setAuditContext");
    const route = AdminApiHandler(async () => ({}), OPTIONS);

    await route(makeRequest("/api/admin/things", { token: VALID_TOKEN }));

    expect(setAuditContext).toHaveBeenCalledWith({
      actor: buildAdminActor(),
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });

  it("returns 201 for created results and a paginated envelope for pages", async () => {
    const { AdminApiHandler } = setup();
    const createRoute = AdminApiHandler(async () => HandlerResults.created({ id: "1" }), OPTIONS);
    const listRoute = AdminApiHandler(
      async () => HandlerResults.page({ items: [1, 2], page: 1, pageSize: 2, total: 5 }, (n) => ({ n })),
      OPTIONS,
    );

    const created = await createRoute(makeRequest("/api/admin/things", { token: VALID_TOKEN }));
    const listed = await listRoute(makeRequest("/api/admin/things", { token: VALID_TOKEN }));

    expect(created.status).toBe(201);
    expect(await listed.json()).toEqual({
      ok: true,
      data: [{ n: 1 }, { n: 2 }],
      pagination: { page: 1, pageSize: 2, total: 5 },
    });
  });
});
