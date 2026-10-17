import bcrypt from "bcryptjs";

const DEFAULT_BCRYPT_ROUNDS = 12;

function defaultRounds(): number {
  const raw = process.env.BCRYPT_ROUNDS;
  if (raw === undefined) return DEFAULT_BCRYPT_ROUNDS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 4 || parsed > 15) return DEFAULT_BCRYPT_ROUNDS;
  return parsed;
}

function hash(plain: string, rounds = defaultRounds()): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

function verify(plain: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}

export const Passwords = { hash, verify };
