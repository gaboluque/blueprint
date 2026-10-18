import { Env } from "@/lib/env";

export const DEFAULT_INTEGRATION_DATABASE_URL = "postgres://blueprint:blueprint@localhost:5434/blueprint_test";

export function integrationDatabaseUrl(): string {
  return process.env.INTEGRATION_DATABASE_URL ?? DEFAULT_INTEGRATION_DATABASE_URL;
}

/** Point integration tests at a dedicated DB; never reuse dev DATABASE_URL from .env. */
export function applyIntegrationEnv(): void {
  process.env.SESSION_SECRET ??= "test-session-secret-that-is-long-enough-123";
  process.env.DATABASE_URL = integrationDatabaseUrl();
  process.env.BCRYPT_ROUNDS ??= "4";
  process.env.NODE_ENV = "test";
  Env.clearCache();
}
