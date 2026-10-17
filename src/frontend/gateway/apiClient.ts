import type { FieldErrors } from "@/lib/errors/domain.errors";
import type { ApiBody } from "@/lib/http/envelope";
import type { PaginationMeta } from "@/lib/pagination";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  pagination?: PaginationMeta;
};

export type ApiFailure = {
  ok: false;
  error: string;
  status: number;
  fieldErrors?: FieldErrors;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

const NETWORK_ERROR = "No pudimos conectar con el servidor. Revisa tu conexión.";
const UNEXPECTED_RESPONSE_ERROR = "Recibimos una respuesta inesperada del servidor.";

function withQuery(path: string, query?: QueryParams): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

function isEnvelope(value: unknown): value is ApiBody<unknown> {
  return typeof value === "object" && value !== null && "ok" in value && typeof value.ok === "boolean";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }

  // 204 carries no envelope; callers type these endpoints as `ApiResult<null>`.
  if (response.status === 204) return { ok: true, data: null as T };

  const json: unknown = await response.json().catch(() => null);
  if (!isEnvelope(json)) return { ok: false, status: response.status, error: UNEXPECTED_RESPONSE_ERROR };
  if (!json.ok) {
    return { ok: false, status: response.status, error: json.error, fieldErrors: json.fieldErrors };
  }
  return { ok: true, data: json.data as T, pagination: json.pagination };
}

/**
 * Browser fetch wrapper for `/api/**`. The session cookie travels automatically.
 * Domain modules (`src/frontend/gateway/institutions.ts`, …) build on these four methods and never throw.
 */
export const ApiClient = {
  get: <T>(path: string, query?: QueryParams) => request<T>("GET", withQuery(path, query)),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
