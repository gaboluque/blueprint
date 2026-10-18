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

/**
 * Fail closed: throws {@link ForbiddenError} (403) unless `allowed` is strictly `true`.
 * Call from services after a domain `*.policy.ts` check, e.g. `Policy.authorize(InstitutionPolicy.canUpdate(actor, institution))`.
 * Optional `message` is user-facing Spanish; omit to use the default forbidden message.
 */
function authorize(allowed: boolean, message?: string): void {
  if (!allowed) throw new ForbiddenError(message);
}

/** Shared role helpers for services. Domain-specific rules live in `<domain>.policy.ts`. */
export const Policy = { isAdmin, isInstitutionStaff, belongsToInstitution, isInstitutionAdmin, authorize };
