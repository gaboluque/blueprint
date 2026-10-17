import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import { StudentErrors } from "../student.errors";
import type { Student } from "../student.model";
import { StudentPolicy } from "../student.policy";

export type GetStudentInput = {
  id: string;
};

async function call(repos: AppRepos, actor: Actor, { id }: GetStudentInput): Promise<Student> {
  const student = await repos.students.findById(id);
  if (!student) throw StudentErrors.notFound();
  Policy.authorize(StudentPolicy.canRead(actor, student));

  return student;
}

export const GetStudent = { call };
