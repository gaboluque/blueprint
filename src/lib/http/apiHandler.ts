import type { z } from "zod";
import { Database } from "@/lib/db/client";
import { RepoRegistry, type AppRepos } from "@/lib/db/repoRegistry";
import { ErrorMapping } from "@/lib/errors/errorMapping";
import { ConsoleLogger, type Logger } from "@/lib/observability/logger";
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
  actor: TActor;
  repos: AppRepos;
  /** Runs `work` with repos bound to one DB transaction. */
  transaction: RepoRegistry["transaction"];
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
  logger: ConsoleLogger,
};

function queryRecord(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

/**
 * Order: authenticate → validate params/query/body → handler → map errors → envelope.
 * Auth runs before the body is read. The handler returns a plain value (200), a
 * `HandlerResults` value (201/204/paginated), or a `Response` (passed through).
 */
function create<TActor>(authenticate: Authenticator<TActor>, deps: ApiHandlerDeps = defaultDeps) {
  return function apiHandler<
    P extends Schema = undefined,
    Q extends Schema = undefined,
    B extends Schema = undefined,
  >(
    handler: (ctx: ApiHandlerContext<TActor, P, Q, B>) => Promise<unknown>,
    options: ApiHandlerOptions<P, Q, B>,
  ) {
    return async (request: Request, context?: RouteContext): Promise<Response> => {
      try {
        const registry = deps.createRegistry();
        const actor = await authenticate(request, registry.repos);
        const params = options.paramsSchema
          ? Validation.parse(options.paramsSchema, await context?.params)
          : undefined;
        const query = options.querySchema ? Validation.parse(options.querySchema, queryRecord(request)) : undefined;
        const body = options.bodySchema
          ? Validation.parse(options.bodySchema, await RequestBody.readJson(request))
          : undefined;

        const ctx = {
          request,
          actor,
          repos: registry.repos,
          transaction: registry.transaction.bind(registry),
          params,
          query,
          body,
        } as ApiHandlerContext<TActor, P, Q, B>;

        return HandlerResults.toResponse(await handler(ctx));
      } catch (error) {
        const mapped = ErrorMapping.map(error, options.fallbackError);
        if (!mapped.expected) deps.logger.error(options.route, error);
        return ApiResponse.error(mapped.message, mapped.status, mapped.fieldErrors);
      }
    };
  };
}

export const ApiHandlerFactory = { create, defaultDeps };
