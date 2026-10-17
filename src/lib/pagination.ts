import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationQuery = {
  page: number;
  pageSize: number;
};

export type PaginationMeta = PaginationQuery & {
  total: number;
};

export type PaginationResult<T> = PaginationMeta & {
  items: T[];
};

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

function offsetOf({ page, pageSize }: PaginationQuery): number {
  return (page - 1) * pageSize;
}

function mapItems<T, U>(result: PaginationResult<T>, fn: (item: T) => U): PaginationResult<U> {
  return { ...result, items: result.items.map(fn) };
}

export const Pagination = { offsetOf, mapItems };
