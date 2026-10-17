import { errors, jwtVerify, SignJWT } from "jose";
import type { Actor } from "./actor";
import type { AuthProvider, AuthSession, Credentials, UserLookup } from "./auth.port";
import { Passwords } from "./password";

const ALGORITHM = "HS256";
const ISSUER = "saludamente-v2";
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
    async signIn(users: UserLookup, { email, password }: Credentials) {
      const user = await users.findByEmail(email);
      const passwordMatches = await Passwords.verify(password, user?.passwordHash ?? TIMING_EQUALIZER_HASH);
      if (!user || !passwordMatches || !user.isAdmin()) return null;
      return issue(user.toActor());
    },

    async authenticate(users: UserLookup, token: string) {
      const userId = await verifiedSubject(token);
      if (!userId) return null;
      const user = await users.findById(userId);
      if (!user?.isAdmin()) return null;
      return user.toActor();
    },
  };
}

export const DevAuthAdapter = { create };
