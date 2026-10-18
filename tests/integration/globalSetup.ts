import { execSync } from "node:child_process";
import { Database } from "@/lib/db/client";
import { applyIntegrationEnv } from "@tests/integration/integrationEnv";
import { EnsureIntegrationDatabase } from "@tests/integration/helpers/ensureIntegrationDatabase";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationMigrations } from "@tests/integration/helpers/integrationMigrations";

async function ensureMigrations(): Promise<void> {
  if (process.env.INTEGRATION_SKIP_MIGRATE === "1") return;
  if (await IntegrationMigrations.isUpToDate()) return;
  execSync("npm run db:migrate", { stdio: "inherit", env: process.env });
}

export default async function globalSetup(): Promise<void> {
  applyIntegrationEnv();
  await EnsureIntegrationDatabase.ensureExists();
  await ensureMigrations();
  await IntegrationDb.reset();
  await Database.close();
}
