import type { PaginationMeta, PaginationResult } from "@/lib/pagination";
import { ApiResponse } from "./apiResponse";

class Created<T> {
  constructor(readonly data: T) {}
}

class Paginated<T> {
  constructor(
    readonly items: T[],
    readonly pagination: PaginationMeta,
  ) {}
}

class NoContent {}

function created<T>(data: T): Created<T> {
  return new Created(data);
}

function noContent(): NoContent {
  return new NoContent();
}

function page<T, U>(result: PaginationResult<T>, format: (item: T) => U): Paginated<U> {
  const { items, ...pagination } = result;
  return new Paginated(items.map(format), pagination);
}

/** Plain value → 200 `{ ok, data }`. A `Response` passes through untouched (e.g. to set cookies). */
function toResponse(result: unknown): Response {
  if (result instanceof Response) return result;
  if (result instanceof Created) return ApiResponse.created(result.data);
  if (result instanceof Paginated) return ApiResponse.paginated(result.items, result.pagination);
  if (result instanceof NoContent) return ApiResponse.noContent();
  return ApiResponse.success(result);
}

export const HandlerResults = { created, noContent, page, toResponse };
