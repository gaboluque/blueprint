import type { User } from "@/domains/users/user.model";
import type { UserLookup } from "@/lib/auth/auth.port";
import { DevAuthAdapter } from "@/lib/auth/devAuth.adapter";
import { Passwords } from "@/lib/auth/password";
import { USER_ID, buildUser } from "../../../factories/models";

const SECRET = "dev-auth-test-secret-that-is-long-enough";
const PASSWORD = "Correcta123!";
const NOW = new Date("2026-05-01T12:00:00.000Z");
const TTL_SECONDS = 3600;

function lookupWith(user: User | null): UserLookup {
  return {
    findByEmail: jest.fn(async () => user),
    findById: jest.fn(async (id: string) => (user?.id === id ? user : null)),
  };
}

async function buildUserWithPassword(): Promise<User> {
  // Low cost factor keeps the suite fast; production uses the default.
  return buildUser({ passwordHash: await Passwords.hash(PASSWORD, 4) });
}

describe("DevAuthAdapter", () => {
  describe("signIn", () => {
    it("issues a session for the right password", async () => {
      const user = await buildUserWithPassword();
      const provider = DevAuthAdapter.create({ secret: SECRET, ttlSeconds: TTL_SECONDS, now: () => NOW });

      const session = await provider.signIn(lookupWith(user), { email: user.email, password: PASSWORD });

      expect(session?.actor).toEqual({ id: USER_ID, email: user.email, name: user.name, role: "admin" });
      expect(session?.expiresAt).toEqual(new Date(NOW.getTime() + TTL_SECONDS * 1000));
      expect(session?.token).toEqual(expect.any(String));
    });

    it("returns null for a wrong password", async () => {
      const user = await buildUserWithPassword();
      const provider = DevAuthAdapter.create({ secret: SECRET });

      const session = await provider.signIn(lookupWith(user), { email: user.email, password: "Incorrecta" });

      expect(session).toBeNull();
    });

    it("returns null for an unknown email", async () => {
      const provider = DevAuthAdapter.create({ secret: SECRET });

      const session = await provider.signIn(lookupWith(null), { email: "nadie@saludamente.test", password: PASSWORD });

      expect(session).toBeNull();
    });
  });

  describe("authenticate", () => {
    async function signedIn(now: () => Date = () => NOW) {
      const user = await buildUserWithPassword();
      const provider = DevAuthAdapter.create({ secret: SECRET, ttlSeconds: TTL_SECONDS, now });
      const session = await provider.signIn(lookupWith(user), { email: user.email, password: PASSWORD });
      if (!session) throw new Error("Expected a session");
      return { user, provider, token: session.token };
    }

    it("resolves the admin actor for a valid token", async () => {
      const { user, provider, token } = await signedIn();

      const actor = await provider.authenticate(lookupWith(user), token);

      expect(actor).toEqual(user.toActor());
    });

    it("rejects a tampered token", async () => {
      const { user, provider, token } = await signedIn();
      const tampered = `${token.slice(0, -2)}xx`;

      const actor = await provider.authenticate(lookupWith(user), tampered);

      expect(actor).toBeNull();
    });

    it("rejects a token signed with another secret", async () => {
      const { user, token } = await signedIn();
      const otherProvider = DevAuthAdapter.create({ secret: "another-secret-that-is-also-long-enough", now: () => NOW });

      const actor = await otherProvider.authenticate(lookupWith(user), token);

      expect(actor).toBeNull();
    });

    it("rejects an expired token", async () => {
      let now = NOW;
      const { user, provider, token } = await signedIn(() => now);
      now = new Date(NOW.getTime() + (TTL_SECONDS + 1) * 1000);

      const actor = await provider.authenticate(lookupWith(user), token);

      expect(actor).toBeNull();
    });

    it("rejects a valid token once the user no longer exists", async () => {
      const { provider, token } = await signedIn();

      const actor = await provider.authenticate(lookupWith(null), token);

      expect(actor).toBeNull();
    });
  });
});
