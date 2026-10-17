import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import type { PaginationResult } from "@/lib/pagination";
import { Policy } from "@/lib/policy/policy";
import { InstitutionPolicy } from "../institution.policy";
import type { InstitutionWithStudentCount } from "../institutions.repo";
import type { ListInstitutionsQuery } from "../validations/institution.validation";

async function call(
  repos: AppRepos,
  actor: Actor,
  { page, pageSize, search, status }: ListInstitutionsQuery,
): Promise<PaginationResult<InstitutionWithStudentCount>> {
  Policy.authorize(InstitutionPolicy.canList(actor));

  return repos.institutions.listWithStudentCounts({ search, status }, { page, pageSize });
}

export const ListInstitutions = { call };
