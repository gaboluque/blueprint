import { z } from "zod";
import { studentStatus } from "@/lib/db/schema";
import { paginationQuerySchema } from "@/lib/pagination";
import { emailSchema, requiredText, searchSchema } from "@/lib/validation/schemas";

/** `GET /api/admin/institutions/[id]/students`. Omitted `status` = all statuses. */
export const listStudentsQuerySchema = paginationQuerySchema.extend({
  search: searchSchema,
  status: z.enum(studentStatus.enumValues).optional(),
});

/** `POST /api/admin/institutions/[id]/students`. `institutionId` comes from the path, never the body. */
export const createStudentBodySchema = z.strictObject({
  firstName: requiredText(100),
  lastName: requiredText(100),
  email: emailSchema,
  documentId: requiredText(30),
  status: z.enum(studentStatus.enumValues).default("active"),
});

/** `PATCH /api/admin/students/[id]`. Moving a student to another institution isn't supported. */
export const updateStudentBodySchema = z
  .strictObject({
    firstName: requiredText(100),
    lastName: requiredText(100),
    email: emailSchema,
    documentId: requiredText(30),
    status: z.enum(studentStatus.enumValues),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { error: "Send at least one field to update." });

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type CreateStudentBody = z.infer<typeof createStudentBodySchema>;
export type UpdateStudentBody = z.infer<typeof updateStudentBodySchema>;
