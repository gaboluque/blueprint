import type { Actor } from "@/lib/auth/actor";
import { Auth } from "@/lib/auth/auth";
import { Database } from "@/lib/db/client";
import { RepoRegistry } from "@/lib/db/repoRegistry";

/**
 * Server-only. The single definition of "signed in" for pages: same check as `AdminApiHandler`
 * (verify the token, re-load the admin). A missing, garbage, or expired cookie resolves to `null`.
 */
async function resolve(token: string | undefined): Promise<Actor | null> {
  if (!token) return null;
  return Auth.provider().authenticate(new RepoRegistry(Database.get()).repos.users, token);
}

export const AdminSessionResolver = { resolve };
