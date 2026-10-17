import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import { StudentErrors } from "../student.errors";
import type { Student } from "../student.model";
import { StudentPolicy } from "../student.policy";

export type DeactivateStudentInput = {
  id: string;
};

async function call(repos: AppRepos, actor: Actor, { id }: DeactivateStudentInput): Promise<Student> {
  const student = await repos.students.findById(id);
  if (!student) throw StudentErrors.notFound();
  const institution = await student.institution(repos);
  if (!institution) throw new Error(`Student ${student.id} has no institution`);
  Policy.authorize(StudentPolicy.canDeactivate(actor, student, institution));
  institution.assertEditable();

  const deactivated = await repos.students.update(id, student.deactivate());
  if (!deactivated) throw StudentErrors.notFound();
  return deactivated;
}

export const DeactivateStudent = { call };
