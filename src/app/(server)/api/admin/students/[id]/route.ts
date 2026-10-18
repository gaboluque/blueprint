import { DeactivateStudent } from "@/domains/students/services/deactivateStudent.service";
import { GetStudent } from "@/domains/students/services/getStudent.service";
import { UpdateStudent } from "@/domains/students/services/updateStudent.service";
import { updateStudentBodySchema } from "@/domains/students/validations/student.validation";
import { StudentView } from "@/domains/students/views/student.view";
import { AdminApiHandler } from "@/lib/http/adminApiHandler";
import { idParamsSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export const GET = AdminApiHandler(
  async ({ actor, repos, params }) => StudentView.format(await GetStudent.call(repos, actor, { id: params.id })),
  {
    route: "GET /api/admin/students/[id]",
    fallbackError: "We couldn't load the student.",
    paramsSchema: idParamsSchema,
  },
);

export const PATCH = AdminApiHandler(
  async ({ actor, transaction, params, body }) =>
    StudentView.format(await transaction((repos) => UpdateStudent.call(repos, actor, { id: params.id, patch: body }))),
  {
    route: "PATCH /api/admin/students/[id]",
    fallbackError: "We couldn't update the student.",
    paramsSchema: idParamsSchema,
    bodySchema: updateStudentBodySchema,
  },
);

/** Deactivates (soft delete); responds 200 with the inactive student. */
export const DELETE = AdminApiHandler(
  async ({ actor, transaction, params }) =>
    StudentView.format(await transaction((repos) => DeactivateStudent.call(repos, actor, { id: params.id }))),
  {
    route: "DELETE /api/admin/students/[id]",
    fallbackError: "We couldn't deactivate the student.",
    paramsSchema: idParamsSchema,
  },
);
