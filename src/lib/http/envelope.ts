import type { FieldErrors } from "@/lib/errors/domain.errors";
import type { PaginationMeta } from "@/lib/pagination";

/** JSON envelope shared by API routes and `src/frontend/gateway`. Dependency-free so the browser can import it. */
export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
  pagination?: PaginationMeta;
};

export type ApiErrorBody = {
  ok: false;
  error: string;
  fieldErrors?: FieldErrors;
};

export type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;
