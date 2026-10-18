import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { Database } from "@/lib/db/client";

function expectedMigrationCount(): number {
  const journalPath = join(process.cwd(), "db/migrations/meta/_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: unknown[] };
  return journal.entries.length;
}

function appliedMigrationCount(result: unknown): number | null {
  const row = Array.isArray(result)
    ? (result[0] as { count?: unknown } | undefined)
    : result && typeof result === "object" && "rows" in result
      ? ((result as { rows: { count?: unknown }[] }).rows[0] ?? undefined)
      : undefined;
  const count = row?.count;
  return typeof count === "number" ? count : typeof count === "string" ? Number.parseInt(count, 10) : null;
}

async function isUpToDate(): Promise<boolean> {
  try {
    const db = Database.get();
    const result = await db.execute(sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`);
    const applied = appliedMigrationCount(result);
    return applied === expectedMigrationCount();
  } catch {
    return false;
  }
}

export const IntegrationMigrations = { isUpToDate };
