import { CreateStudent } from "@/domains/students/services/createStudent.service";
import { ListInstitutionStudents } from "@/domains/students/services/listInstitutionStudents.service";
import { createStudentBodySchema, listStudentsQuerySchema } from "@/domains/students/validations/student.validation";
import { StudentView } from "@/domains/students/views/student.view";
import { AdminApiHandler } from "@/lib/http/adminApiHandler";
import { HandlerResults } from "@/lib/http/handlerResults";
import { idParamsSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export const GET = AdminApiHandler(
  async ({ actor, repos, params, query }) =>
    HandlerResults.page(
      await ListInstitutionStudents.call(repos, actor, { institutionId: params.id, query }),
      StudentView.format,
    ),
  {
    route: "GET /api/admin/institutions/[id]/students",
    fallbackError: "No pudimos cargar los estudiantes.",
    paramsSchema: idParamsSchema,
    querySchema: listStudentsQuerySchema,
  },
);

export const POST = AdminApiHandler(
  async ({ actor, transaction, params, body }) => {
    const student = await transaction((repos) => CreateStudent.call(repos, actor, { institutionId: params.id, body }));
    return HandlerResults.created(StudentView.format(student));
  },
  {
    route: "POST /api/admin/institutions/[id]/students",
    fallbackError: "No pudimos crear el estudiante.",
    paramsSchema: idParamsSchema,
    bodySchema: createStudentBodySchema,
  },
);
