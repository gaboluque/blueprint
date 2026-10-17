// Unit tests never connect; the pool is created lazily and these values only satisfy env validation.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:1/test";
process.env.SESSION_SECRET ??= "test-session-secret-that-is-long-enough-123";
