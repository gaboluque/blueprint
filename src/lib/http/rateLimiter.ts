type Bucket = { count: number; resetAt: number };

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

/**
 * Fixed-window counter, in memory. Good enough for a single app instance; swap for a
 * shared store (Postgres, Redis) before running more than one.
 */
const buckets = new Map<string, Bucket>();

function consume(key: string, { limit, windowMs }: RateLimitOptions): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function reset(): void {
  buckets.clear();
}

export const RateLimiter = { consume, reset };
