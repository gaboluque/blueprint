import { Env } from "@/lib/env";
import type { AuthProvider } from "./auth.port";
import { DevAuthAdapter } from "./devAuth.adapter";

let provider: AuthProvider | null = null;

/** Single wiring point: swap the adapter here to replace auth. */
function getProvider(): AuthProvider {
  provider ??= DevAuthAdapter.create({ secret: Env.get().SESSION_SECRET });
  return provider;
}

export const Auth = { provider: getProvider };
