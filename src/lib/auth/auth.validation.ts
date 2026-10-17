import { z } from "zod";
import { emailSchema } from "@/lib/validation/schemas";

/** `POST /api/admin/sessions`. */
export const signInBodySchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export type SignInBody = z.infer<typeof signInBodySchema>;
