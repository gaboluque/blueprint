import type { Actor } from "@/lib/auth/actor";
import type { Institution } from "@/domains/institutions/institution.model";
import { Policy } from "@/lib/policy/policy";
import type { Student } from "./student.model";

function isStaffOfInstitution(actor: Actor, institutionId: string): boolean {
  return Policy.isInstitutionStaff(actor) && Policy.belongsToInstitution(actor, institutionId);
}

// Who may act. Writes also require `institution.assertEditable()` (model rule) in the service.
function canRead(actor: Actor, student: Student): boolean {
  if (Policy.isAdmin(actor)) return true;
  return isStaffOfInstitution(actor, student.institutionId);
}

function canUpdate(actor: Actor, student: Student, _institution: Institution): boolean {
  if (Policy.isAdmin(actor)) return true;
  return isStaffOfInstitution(actor, student.institutionId) && Policy.isInstitutionAdmin(actor);
}

function canDeactivate(actor: Actor, student: Student, _institution: Institution): boolean {
  if (Policy.isAdmin(actor)) return true;
  return isStaffOfInstitution(actor, student.institutionId) && Policy.isInstitutionAdmin(actor);
}

export const StudentPolicy = { canRead, canUpdate, canDeactivate };
