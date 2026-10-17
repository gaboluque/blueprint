import { eq } from "drizzle-orm";
import type { UserProps } from "@/domains/users/user.model";
import { Passwords } from "@/lib/auth/password";
import { Database } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { buildUser } from "@tests/factories/models";

export const INTEGRATION_ADMIN = {
  email: "integration-admin@test.local",
  password: "IntegrationAdmin123!",
  name: "Integration Admin",
};

type CreateUserInput = Partial<Pick<UserProps, "email" | "name" | "role">> & {
  password?: string;
};

let cachedIntegrationAdminPasswordHash: string | null = null;

async function passwordHashForCreate(password: string, passwordOverride: string | undefined): Promise<string> {
  if (passwordOverride === undefined && password === INTEGRATION_ADMIN.password) {
    cachedIntegrationAdminPasswordHash ??= await Passwords.hash(password);
    return cachedIntegrationAdminPasswordHash;
  }
  return Passwords.hash(password);
}

async function create(overrides: CreateUserInput = {}) {
  const { password: passwordOverride, ...userOverrides } = overrides;
  const sample = buildUser({
    email: INTEGRATION_ADMIN.email,
    name: INTEGRATION_ADMIN.name,
    role: "admin",
    ...userOverrides,
  });
  const password = passwordOverride ?? INTEGRATION_ADMIN.password;
  const passwordHash = await passwordHashForCreate(password, passwordOverride);

  const db = Database.get();
  const [row] = await db
    .insert(users)
    .values({
      email: sample.email,
      name: sample.name,
      role: sample.role,
      passwordHash,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: sample.name, role: sample.role, passwordHash },
    })
    .returning();
  if (row) return row;

  const [existing] = await db.select().from(users).where(eq(users.email, sample.email));
  if (!existing) throw new Error("UserFactory.create failed");
  return existing;
}

async function createAdmin(overrides: Omit<CreateUserInput, "role"> = {}) {
  return create({ ...overrides, role: "admin" });
}

export const UserFactory = { create, createAdmin };
