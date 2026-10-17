import type { UsersRepo } from "@/domains/users/users.repo";
import type { Actor } from "./actor";

export type Credentials = {
  email: string;
  password: string;
};

export type UserLookup = Pick<UsersRepo, "findById" | "findByEmail">;

export type AuthSession = {
  actor: Actor;
  /** Opaque to callers; stored in the session cookie. */
  token: string;
  expiresAt: Date;
};

/**
 * Replaceable auth boundary. The dev adapter verifies a bcrypt hash and signs a JWT;
 * a hosted IdP (Auth0, Clerk, Cognito…) can implement the same two methods.
 * Both resolve to `null` on any failure so callers fail closed without leaking why.
 */
export type AuthProvider = {
  signIn(users: UserLookup, credentials: Credentials): Promise<AuthSession | null>;
  /** Re-loads the user so deleted accounts lose access before the token expires. */
  authenticate(users: UserLookup, token: string): Promise<Actor | null>;
};
