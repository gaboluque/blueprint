import { CreateInstitution } from "@/domains/institutions/services/createInstitution.service";
import { ListInstitutions } from "@/domains/institutions/services/listInstitutions.service";
import {
  createInstitutionBodySchema,
  listInstitutionsQuerySchema,
} from "@/domains/institutions/validations/institution.validation";
import { InstitutionView } from "@/domains/institutions/views/institution.view";
import { AdminApiHandler } from "@/lib/http/adminApiHandler";
import { HandlerResults } from "@/lib/http/handlerResults";

export const runtime = "nodejs";

export const GET = AdminApiHandler(
  async ({ actor, repos, query }) =>
    HandlerResults.page(await ListInstitutions.call(repos, actor, query), InstitutionView.formatListItem),
  {
    route: "GET /api/admin/institutions",
    fallbackError: "No pudimos cargar las instituciones.",
    querySchema: listInstitutionsQuerySchema,
  },
);

export const POST = AdminApiHandler(
  async ({ actor, transaction, body }) =>
    HandlerResults.created(
      InstitutionView.format(await transaction((repos) => CreateInstitution.call(repos, actor, body))),
    ),
  {
    route: "POST /api/admin/institutions",
    fallbackError: "No pudimos crear la institución.",
    bodySchema: createInstitutionBodySchema,
  },
);
