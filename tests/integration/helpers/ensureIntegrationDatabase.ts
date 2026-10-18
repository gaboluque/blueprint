import { Pool } from "pg";
import { integrationDatabaseUrl } from "@tests/integration/integrationEnv";

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

async function ensureExists(): Promise<void> {
  const targetUrl = integrationDatabaseUrl();
  const url = new URL(targetUrl);
  const databaseName = url.pathname.replace(/^\//, "");
  if (!databaseName) {
    throw new Error("Integration database URL must include a database name.");
  }

  url.pathname = "/postgres";
  const admin = new Pool({ connectionString: url.toString() });
  try {
    const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);
    if (existing.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${quoteIdent(databaseName)}`);
    }
  } finally {
    await admin.end();
  }
}

export const EnsureIntegrationDatabase = { ensureExists };
