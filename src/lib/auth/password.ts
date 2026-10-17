import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

function hash(plain: string, rounds = BCRYPT_ROUNDS): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

function verify(plain: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}

export const Passwords = { hash, verify };
