import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

function get(): AppEnv {
  cached ??= envSchema.parse(process.env);
  return cached;
}

function clearCache(): void {
  cached = null;
}

export const Env = { get, clearCache };
