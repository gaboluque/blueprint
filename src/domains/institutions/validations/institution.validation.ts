import { z } from "zod";
import { institutionStatus } from "@/lib/db/schema";
import { paginationQuerySchema } from "@/lib/pagination";
import { emailSchema, requiredText, searchSchema } from "@/lib/validation/schemas";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(64)
  .regex(SLUG_PATTERN, { error: "Use lowercase letters, numbers, and hyphens only." });

/** `GET /api/admin/institutions`. Omitted `status` = all statuses. */
export const listInstitutionsQuerySchema = paginationQuerySchema.extend({
  search: searchSchema,
  status: z.enum(institutionStatus.enumValues).optional(),
});

/** `POST /api/admin/institutions`. Unknown keys (e.g. `status`, `archivedAt`) are rejected. */
export const createInstitutionBodySchema = z.strictObject({
  name: requiredText(200),
  slug: slugSchema,
  contactEmail: emailSchema,
});

/** `PATCH /api/admin/institutions/[id]`. Status changes only via `DELETE` (archive). */
export const updateInstitutionBodySchema = createInstitutionBodySchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, { error: "Send at least one field to update." });

export type ListInstitutionsQuery = z.infer<typeof listInstitutionsQuerySchema>;
export type CreateInstitutionBody = z.infer<typeof createInstitutionBodySchema>;
export type UpdateInstitutionBody = z.infer<typeof updateInstitutionBodySchema>;
