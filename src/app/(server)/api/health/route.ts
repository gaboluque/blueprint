import { sql } from "drizzle-orm";
import { Database } from "@/lib/db/client";
import { AppLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";

/** Unauthenticated, no envelope: load balancers and uptime checks expect a plain 200/503. */
export async function GET(): Promise<Response> {
  try {
    await Database.get().execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch (error) {
    AppLogger.get().error({ err: error instanceof Error ? error.message : String(error) }, "health_check_failed");
    return Response.json({ status: "error" }, { status: 503 });
  }
}
