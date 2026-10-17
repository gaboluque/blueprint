import { InstitutionErrors } from "@/domains/institutions/institution.errors";
import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import type { Student } from "../student.model";
import type { CreateStudentBody } from "../validations/student.validation";

export type CreateStudentInput = {
  institutionId: string;
  body: CreateStudentBody;
};

async function call(repos: AppRepos, actor: Actor, { institutionId, body }: CreateStudentInput): Promise<Student> {
  const institution = await repos.institutions.findById(institutionId);
  if (!institution) throw InstitutionErrors.notFound();
  Policy.authorize(InstitutionPolicy.canManageStudents(actor, institution));
  institution.assertEditable();

  return repos.students.create({ ...body, institutionId: institution.id });
}

export const CreateStudent = { call };
