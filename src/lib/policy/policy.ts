import type { Actor } from "@/lib/auth/actor";
import { ForbiddenError } from "@/lib/errors/domain.errors";

/** Fail closed: any role not explicitly allowed is denied. */
function isAdmin(actor: Actor | null | undefined): boolean {
  return actor?.role === "admin";
}

function isInstitutionStaff(actor: Actor | null | undefined): boolean {
  return actor?.role === "institution_staff";
}

function belongsToInstitution(actor: Actor, institutionId: string): boolean {
  return actor.institutionId === institutionId;
}

function isInstitutionAdmin(actor: Actor): boolean {
  return isInstitutionStaff(actor) && actor.institutionRole === "admin";
}

function authorize(allowed: boolean, message?: string): void {
  if (allowed !== true) throw new ForbiddenError(message);
}

export const Policy = { isAdmin, isInstitutionStaff, belongsToInstitution, isInstitutionAdmin, authorize };
