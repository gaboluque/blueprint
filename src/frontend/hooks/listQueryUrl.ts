import type { z } from "zod";
import type { ListQuery } from "@/frontend/components/shared/listTypes";

/** Parse list query from the browser URL; invalid params fall back to defaults. */
export function parseListQueryFromUrl<Q extends ListQuery>(
  schema: z.ZodType<Q>,
  searchParams: URLSearchParams,
  defaults: Q,
): Q {
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : defaults;
}

/** Omit values equal to defaults so the URL stays minimal (`page=1`, empty search, etc.). */
export function listQueryToSearchParams<Q extends ListQuery>(query: Q, defaults: Q): URLSearchParams {
  const params = new URLSearchParams();
  const keys = new Set([...Object.keys(defaults), ...Object.keys(query as object)]) as Set<keyof Q>;

  for (const key of keys) {
    const value = query[key];
    const defaultValue = defaults[key];
    if (value === defaultValue || value === undefined || value === null || value === "") continue;
    params.set(String(key), String(value));
  }

  return params;
}

export function areListQueriesEqual<Q extends ListQuery>(a: Q, b: Q): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Q>;
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
