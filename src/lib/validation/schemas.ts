import { z } from "zod";

export const idParamsSchema = z.object({ id: z.uuid() });
export type IdParams = z.infer<typeof idParamsSchema>;

// Normalize before validating: `z.email().trim()` checks the format first, so padded input fails.
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

/** Optional search term: trimmed, blank → undefined. */
export const searchSchema = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => (value ? value : undefined));

export const requiredText = (max: number) => z.string().trim().min(1).max(max);
