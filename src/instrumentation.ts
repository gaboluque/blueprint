/** Fails fast on a bad .env at server boot instead of on the first request. */
// eslint-disable-next-line boundaries/no-unknown-files
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { Env } = await import("@/lib/env");
  Env.get();
}
