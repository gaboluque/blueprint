import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import { StudentErrors } from "../student.errors";
import type { Student } from "../student.model";
import { StudentPolicy } from "../student.policy";
import type { UpdateStudentBody } from "../validations/student.validation";

export type UpdateStudentInput = {
  id: string;
  patch: UpdateStudentBody;
};

/** Unique email violations surface from the repo as `409`. */
async function call(repos: AppRepos, actor: Actor, { id, patch }: UpdateStudentInput): Promise<Student> {
  const student = await repos.students.findById(id);
  if (!student) throw StudentErrors.notFound();
  const institution = await student.institution(repos);
  if (!institution) throw new Error(`Student ${student.id} has no institution`);
  Policy.authorize(StudentPolicy.canUpdate(actor, student, institution));
  institution.assertEditable();

  const updated = await repos.students.update(id, patch);
  if (!updated) throw StudentErrors.notFound();
  return updated;
}

export const UpdateStudent = { call };
