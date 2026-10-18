export type ErrorReporterPort = {
  report(error: unknown, context: Record<string, unknown>): void;
};

const noop: ErrorReporterPort = { report: () => {} };

let current: ErrorReporterPort = noop;

/** Swap in a real adapter (Sentry, Honeycomb, …) from `instrumentation.ts`; nothing else changes. */
function set(reporter: ErrorReporterPort): void {
  current = reporter;
}

function report(error: unknown, context: Record<string, unknown>): void {
  current.report(error, context);
}

export const ErrorReporter = { report, set };
