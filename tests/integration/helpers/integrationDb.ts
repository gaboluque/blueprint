import { sql } from "drizzle-orm";
import { Database } from "@/lib/db/client";
import { RateLimiter } from "@/lib/http/rateLimiter";
import { IntegrationSequence } from "@tests/integration/factories/sequence";

async function reset(): Promise<void> {
  IntegrationSequence.reset();
  RateLimiter.reset();
  const db = Database.get();
  await db.execute(
    sql`TRUNCATE TABLE audit_events, institution_members, students, institutions, users RESTART IDENTITY CASCADE`,
  );
}

export const IntegrationDb = { reset };
