import type { z } from "zod";
import type { AuditContext } from "@/domains/audit/auditEvents.repo";
import { Database } from "@/lib/db/client";
import { RepoRegistry, type AppRepos } from "@/lib/db/repoRegistry";
import { ErrorMapping } from "@/lib/errors/errorMapping";
import { ErrorReporter } from "@/lib/observability/errorReporter";
import { AppLogger, type Logger } from "@/lib/observability/logger";
import { RequestId } from "@/lib/observability/requestId";
import { Validation } from "@/lib/validation/validation";
import { ApiResponse } from "./apiResponse";
import { HandlerResults } from "./handlerResults";
import { RequestBody } from "./readJsonBody";

type Schema = z.ZodType | undefined;
type Parsed<S extends Schema> = S extends z.ZodType ? z.output<S> : undefined;

export type ApiHandlerOptions<P extends Schema, Q extends Schema, B extends Schema> = {
  /** Log label, e.g. `"GET /api/admin/institutions"`. */
  route: string;
  /** Spanish message returned for unexpected (500) errors. */
  fallbackError: string;
  paramsSchema?: P;
  querySchema?: Q;
  bodySchema?: B;
};

export type ApiHandlerContext<TActor, P extends Schema, Q extends Schema, B extends Schema> = {
  request: Request;
  requestId: string;
  actor: TActor;
  repos: AppRepos;
  /** Runs `work` with repos bound to one DB transaction. */
  transaction: RepoRegistry["transaction"];
  /** Lets public routes (sign-in) attach the actor so subsequent audit writes land under their name. */
  setAuditContext: (context: AuditContext) => void;
  params: Parsed<P>;
  query: Parsed<Q>;
  body: Parsed<B>;
};

export type RouteContext = { params: Promise<unknown> };

export type Authenticator<TActor> = (request: Request, repos: AppRepos) => Promise<TActor>;

export type ApiHandlerDeps = {
  createRegistry: () => RepoRegistry;
  logger: Logger;
};

const defaultDeps: ApiHandlerDeps = {
  createRegistry: () => new RepoRegistry(Database.get()),
  get logger() {
    return AppLogger.get();
  },
};

function queryRecord(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

function actorIdOf(actor: unknown): string | null {
  if (actor && typeof actor === "object" && "id" in actor && typeof actor.id === "string") return actor.id;
  return null;
}

/** Narrows an opaque `TActor` to the shape required for audit context (admin actors). */
function actorForAudit(actor: unknown): AuditContext["actor"] | null {
  if (!actor || typeof actor !== "object") return null;
  const candidate = actor as Partial<AuditContext["actor"]>;
  if (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.role === "string"
  ) {
    return candidate as AuditContext["actor"];
  }
  return null;
}

function withRequestId(response: Response, requestId: string): Response {
  response.headers.set(RequestId.headerName, requestId);
  return response;
}

/**
 * Order: authenticate → validate params/query/body → handler → map errors → envelope.
 * Auth runs before the body is read. The handler returns a plain value (200), a
 * `HandlerResults` value (201/204/paginated), or a `Response` (passed through).
 * Every response carries `x-request-id` and produces one structured log line.
 */
function create<TActor>(authenticate: Authenticator<TActor>, deps: ApiHandlerDeps = defaultDeps) {
  return function apiHandler<P extends Schema = undefined, Q extends Schema = undefined, B extends Schema = undefined>(
    handler: (ctx: ApiHandlerContext<TActor, P, Q, B>) => Promise<unknown>,
    options: ApiHandlerOptions<P, Q, B>,
  ) {
    return async (request: Request, context?: RouteContext): Promise<Response> => {
      const requestId = RequestId.mint();
      const log = deps.logger.child({ requestId, route: options.route, method: request.method });
      const startedAt = performance.now();
      let actor: TActor | null = null;

      try {
        const registry = deps.createRegistry();
        actor = await authenticate(request, registry.repos);
        const auditActor = actorForAudit(actor);
        if (auditActor) registry.setAuditContext({ actor: auditActor, requestId });
        const params = options.paramsSchema ? Validation.parse(options.paramsSchema, await context?.params) : undefined;
        const query = options.querySchema ? Validation.parse(options.querySchema, queryRecord(request)) : undefined;
        const body = options.bodySchema
          ? Validation.parse(options.bodySchema, await RequestBody.readJson(request))
          : undefined;

        const ctx = {
          request,
          requestId,
          actor,
          repos: registry.repos,
          transaction: registry.transaction.bind(registry),
          setAuditContext: registry.setAuditContext.bind(registry),
          params,
          query,
          body,
        } as ApiHandlerContext<TActor, P, Q, B>;

        const response = withRequestId(HandlerResults.toResponse(await handler(ctx)), requestId);
        log.info(
          { status: response.status, durationMs: Math.round(performance.now() - startedAt), actorId: actorIdOf(actor) },
          "request",
        );
        return response;
      } catch (error) {
        const mapped = ErrorMapping.map(error, options.fallbackError);
        const response = withRequestId(ApiResponse.error(mapped.message, mapped.status, mapped.fieldErrors), requestId);
        const payload = {
          status: mapped.status,
          durationMs: Math.round(performance.now() - startedAt),
          actorId: actorIdOf(actor),
          err: error instanceof Error ? { name: error.name, message: error.message } : { cause: String(error) },
        };
        if (mapped.expected) {
          log.warn(payload, "request_failed");
        } else {
          ErrorReporter.report(error, { route: options.route, requestId, actorId: actorIdOf(actor) });
          log.error(
            { ...payload, err: error instanceof Error ? { ...payload.err, stack: error.stack } : payload.err },
            "request_failed",
          );
        }
        return response;
      }
    };
  };
}

export const ApiHandlerFactory = { create, defaultDeps };
