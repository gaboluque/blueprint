import type { Actor } from "@/lib/auth/actor";
import { ForbiddenError } from "@/lib/errors/domain.errors";

/** Fail closed: any role not explicitly allowed is denied. */
function isAdmin(actor: Actor | null | undefined): boolean {
  return actor?.role === "admin";
}

function authorize(allowed: boolean, message?: string): void {
  if (allowed !== true) throw new ForbiddenError(message);
}

export const Policy = { isAdmin, authorize };
