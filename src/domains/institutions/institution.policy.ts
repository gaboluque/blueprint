import type { Actor } from "@/lib/auth/actor";
import { Policy } from "@/lib/policy/policy";
import type { Institution } from "./institution.model";

// Who may act. State rules (archived = read-only) live on the model.
function canList(actor: Actor): boolean {
  return Policy.isAdmin(actor);
}

function canCreate(actor: Actor): boolean {
  return Policy.isAdmin(actor);
}

function canRead(actor: Actor, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

function canUpdate(actor: Actor, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

function canArchive(actor: Actor, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

function canManageStudents(actor: Actor, _institution: Institution): boolean {
  return Policy.isAdmin(actor);
}

export const InstitutionPolicy = {
  canList,
  canCreate,
  canRead,
  canUpdate,
  canArchive,
  canManageStudents,
};
