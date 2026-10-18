import { errors, jwtVerify, SignJWT } from "jose";
import type { Actor } from "./actor";
import { ActorResolver } from "./actorResolver";
import type { AuthProvider, AuthRepos, AuthSession, Credentials } from "./auth.port";
import { Passwords } from "./password";

const ALGORITHM = "HS256";
const ISSUER = "blueprint";
const AUDIENCE = "admin";
const DEFAULT_TTL_SECONDS = 60 * 60 * 8;
// Compared against when the email is unknown, so response time doesn't reveal which accounts exist.
const TIMING_EQUALIZER_HASH = "$2b$12$mCwEF5QnMbfyrEcXFAMjhevLl8vaTbsY3rCi01bSrnjDhjPk7b5Ky";

export type DevAuthConfig = {
  secret: string;
  ttlSeconds?: number;
  now?: () => Date;
};

function create({ secret, ttlSeconds = DEFAULT_TTL_SECONDS, now = () => new Date() }: DevAuthConfig): AuthProvider {
  const key = new TextEncoder().encode(secret);

  async function issue(actor: Actor): Promise<AuthSession> {
    const issuedAt = now();
    const expiresAt = new Date(issuedAt.getTime() + ttlSeconds * 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(actor.id)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt(Math.floor(issuedAt.getTime() / 1000))
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(key);
    return { actor, token, expiresAt };
  }

  async function verifiedSubject(token: string): Promise<string | null> {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
        currentDate: now(),
      });
      return payload.sub ?? null;
    } catch (error) {
      if (error instanceof errors.JOSEError) return null;
      throw error;
    }
  }

  return {
    async signIn(repos: AuthRepos, { email, password }: Credentials) {
      const user = await repos.users.findByEmail(email);
      const passwordMatches = await Passwords.verify(password, user?.passwordHash ?? TIMING_EQUALIZER_HASH);
      if (!user || !passwordMatches) return null;
      const actor = await ActorResolver.resolve(repos, user);
      if (!actor) return null;
      return issue(actor);
    },

    async authenticate(repos: AuthRepos, token: string) {
      const userId = await verifiedSubject(token);
      if (!userId) return null;
      const user = await repos.users.findById(userId);
      if (!user) return null;
      return ActorResolver.resolve(repos, user);
    },
  };
}

export const DevAuthAdapter = { create };
