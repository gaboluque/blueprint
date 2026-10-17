import { ArchiveInstitution } from "@/domains/institutions/services/archiveInstitution.service";
import { GetInstitution } from "@/domains/institutions/services/getInstitution.service";
import { UpdateInstitution } from "@/domains/institutions/services/updateInstitution.service";
import { updateInstitutionBodySchema } from "@/domains/institutions/validations/institution.validation";
import { InstitutionView } from "@/domains/institutions/views/institution.view";
import { AdminApiHandler } from "@/lib/http/adminApiHandler";
import { idParamsSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export const GET = AdminApiHandler(
  async ({ actor, repos, params }) => InstitutionView.format(await GetInstitution.call(repos, actor, params)),
  {
    route: "GET /api/admin/institutions/[id]",
    fallbackError: "No pudimos cargar la institución.",
    paramsSchema: idParamsSchema,
  },
);

export const PATCH = AdminApiHandler(
  async ({ actor, transaction, params, body }) =>
    InstitutionView.format(
      await transaction((repos) => UpdateInstitution.call(repos, actor, { id: params.id, patch: body })),
    ),
  {
    route: "PATCH /api/admin/institutions/[id]",
    fallbackError: "No pudimos actualizar la institución.",
    paramsSchema: idParamsSchema,
    bodySchema: updateInstitutionBodySchema,
  },
);

export const DELETE = AdminApiHandler(
  async ({ actor, transaction, params }) =>
    InstitutionView.format(await transaction((repos) => ArchiveInstitution.call(repos, actor, params))),
  {
    route: "DELETE /api/admin/institutions/[id]",
    fallbackError: "No pudimos archivar la institución.",
    paramsSchema: idParamsSchema,
  },
);
