import { drizzle, type NodePgDatabase, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { Env } from "@/lib/env";
import * as schema from "./schema";

export type Schema = typeof schema;
export type Db = NodePgDatabase<Schema>;
/** Root db or a transaction: repos accept either so services can run inside one `tx`. */
export type DbExecutor = PgDatabase<NodePgQueryResultHKT, Schema>;

type DbHandle = { pool: Pool; db: Db };

// Cached on globalThis so dev hot reload reuses one pool instead of leaking connections.
const globalForDb = globalThis as typeof globalThis & { __saludamenteDb?: DbHandle };

function get(): Db {
  if (!globalForDb.__saludamenteDb) {
    const pool = new Pool({ connectionString: Env.get().DATABASE_URL, max: 10 });
    globalForDb.__saludamenteDb = { pool, db: drizzle({ client: pool, schema }) };
  }
  return globalForDb.__saludamenteDb.db;
}

async function close(): Promise<void> {
  const handle = globalForDb.__saludamenteDb;
  if (!handle) return;
  globalForDb.__saludamenteDb = undefined;
  await handle.pool.end();
}

export const Database = { get, close };
