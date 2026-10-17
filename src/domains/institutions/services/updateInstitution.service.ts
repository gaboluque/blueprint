import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import { InstitutionErrors } from "../institution.errors";
import type { Institution } from "../institution.model";
import { InstitutionPolicy } from "../institution.policy";
import type { UpdateInstitutionBody } from "../validations/institution.validation";

export type UpdateInstitutionInput = { id: string; patch: UpdateInstitutionBody };

async function call(repos: AppRepos, actor: Actor, { id, patch }: UpdateInstitutionInput): Promise<Institution> {
  const institution = await repos.institutions.findById(id);
  if (!institution) throw InstitutionErrors.notFound();
  Policy.authorize(InstitutionPolicy.canUpdate(actor, institution));
  institution.assertEditable();

  const updated = await repos.institutions.update(id, patch);
  if (!updated) throw InstitutionErrors.notFound();
  return updated;
}

export const UpdateInstitution = { call };
