import type { InstitutionMembersRepo } from "@/domains/institutionMembers/institutionMembers.repo";
import type { UsersRepo } from "@/domains/users/users.repo";
import type { Actor } from "./actor";

export type AuthRepos = {
  users: Pick<UsersRepo, "findById" | "findByEmail">;
  institutionMembers: Pick<InstitutionMembersRepo, "findByUserId">;
};

export type Credentials = {
  email: string;
  password: string;
};

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
  signIn(repos: AuthRepos, credentials: Credentials): Promise<AuthSession | null>;
  /** Re-loads the user and membership so revoked access drops before the token expires. */
  authenticate(repos: AuthRepos, token: string): Promise<Actor | null>;
};
