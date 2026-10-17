import type { Actor } from "@/lib/auth/actor";
import type { Institution } from "@/domains/institutions/institution.model";
import { Policy } from "@/lib/policy/policy";
import type { Student } from "./student.model";

// Who may act. Writes also require `institution.assertEditable()` (model rule) in the service.
function canRead(actor: Actor, _student: Student): boolean {
  return Policy.isAdmin(actor);
}

function canUpdate(actor: Actor, _student: Student, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

function canDeactivate(actor: Actor, _student: Student, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

export const StudentPolicy = { canRead, canUpdate, canDeactivate };
