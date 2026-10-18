import { RateLimiter } from "@/lib/http/rateLimiter";

describe("RateLimiter", () => {
  afterEach(() => {
    RateLimiter.reset();
  });

  it("allows requests under the limit", () => {
    const allowed = RateLimiter.consume("key", { limit: 2, windowMs: 1000 });

    expect(allowed).toBe(true);
  });

  it("blocks requests once the limit is reached within the window", () => {
    RateLimiter.consume("key", { limit: 2, windowMs: 1000 });
    RateLimiter.consume("key", { limit: 2, windowMs: 1000 });

    const blocked = RateLimiter.consume("key", { limit: 2, windowMs: 1000 });

    expect(blocked).toBe(false);
  });

  it("tracks separate keys independently", () => {
    RateLimiter.consume("a", { limit: 1, windowMs: 1000 });

    const allowedForOtherKey = RateLimiter.consume("b", { limit: 1, windowMs: 1000 });

    expect(allowedForOtherKey).toBe(true);
  });

  it("resets the window after it elapses", () => {
    jest.useFakeTimers();
    RateLimiter.consume("key", { limit: 1, windowMs: 1000 });
    jest.advanceTimersByTime(1001);

    const allowed = RateLimiter.consume("key", { limit: 1, windowMs: 1000 });

    expect(allowed).toBe(true);
    jest.useRealTimers();
  });
});
