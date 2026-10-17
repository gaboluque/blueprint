/** Replaceable sink for unexpected errors (swap for Sentry later). Never pass request bodies or PII. */
function error(route: string, cause: unknown): void {
  const detail = cause instanceof Error ? { name: cause.name, message: cause.message, stack: cause.stack } : { cause };
  console.error(`[${route}] unexpected error`, detail);
}

export type Logger = { error: typeof error };

export const ConsoleLogger: Logger = { error };
