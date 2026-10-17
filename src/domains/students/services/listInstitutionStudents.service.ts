import { InstitutionErrors } from "@/domains/institutions/institution.errors";
import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import type { PaginationResult } from "@/lib/pagination";
import { Policy } from "@/lib/policy/policy";
import type { Student } from "../student.model";
import type { ListStudentsQuery } from "../validations/student.validation";

export type ListInstitutionStudentsInput = {
  institutionId: string;
  query: ListStudentsQuery;
};

async function call(
  repos: AppRepos,
  actor: Actor,
  { institutionId, query: { page, pageSize, search, status } }: ListInstitutionStudentsInput,
): Promise<PaginationResult<Student>> {
  const institution = await repos.institutions.findById(institutionId);
  if (!institution) throw InstitutionErrors.notFound();
  Policy.authorize(InstitutionPolicy.canRead(actor, institution));

  return institution.students(repos, { page, pageSize }, { search, status });
}

export const ListInstitutionStudents = { call };
