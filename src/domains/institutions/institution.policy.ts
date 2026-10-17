import type { Actor } from "@/lib/auth/actor";
import { Policy } from "@/lib/policy/policy";
import type { Institution } from "./institution.model";

function isStaffOf(actor: Actor, institution: Institution): boolean {
  return Policy.isInstitutionStaff(actor) && Policy.belongsToInstitution(actor, institution.id);
}

// Who may act. State rules (archived = read-only) live on the model.
function canList(actor: Actor): boolean {
  return Policy.isAdmin(actor);
}

function canCreate(actor: Actor): boolean {
  return Policy.isAdmin(actor);
}

function canRead(actor: Actor, institution: Institution): boolean {
  return Policy.isAdmin(actor) || isStaffOf(actor, institution);
}

function canUpdate(actor: Actor, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

function canArchive(actor: Actor, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

function canManageStudents(actor: Actor, institution: Institution): boolean {
  if (Policy.isAdmin(actor)) return true;
  return isStaffOf(actor, institution) && Policy.isInstitutionAdmin(actor);
}

export const InstitutionPolicy = {
  canList,
  canCreate,
  canRead,
  canUpdate,
  canArchive,
  canManageStudents,
};
