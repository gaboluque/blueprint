import { execSync } from "node:child_process";
import { Database } from "@/lib/db/client";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationMigrations } from "@tests/integration/helpers/integrationMigrations";

function applyIntegrationEnvDefaults(): void {
  process.env.SESSION_SECRET ??= "test-session-secret-that-is-long-enough-123";
  process.env.DATABASE_URL ??= "postgres://saludamente:saludamente@localhost:5434/saludamente_v2";
  process.env.BCRYPT_ROUNDS ??= "4";
}

async function ensureMigrations(): Promise<void> {
  if (process.env.INTEGRATION_SKIP_MIGRATE === "1") return;
  if (await IntegrationMigrations.isUpToDate()) return;
  execSync("npm run db:migrate", { stdio: "inherit", env: process.env });
}

export default async function globalSetup(): Promise<void> {
  applyIntegrationEnvDefaults();
  await ensureMigrations();
  await IntegrationDb.reset();
  await Database.close();
}
