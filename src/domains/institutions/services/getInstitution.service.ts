import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import { InstitutionErrors } from "../institution.errors";
import type { Institution } from "../institution.model";
import { InstitutionPolicy } from "../institution.policy";

export type GetInstitutionInput = { id: string };

async function call(repos: AppRepos, actor: Actor, { id }: GetInstitutionInput): Promise<Institution> {
  const institution = await repos.institutions.findById(id);
  if (!institution) throw InstitutionErrors.notFound();

  Policy.authorize(InstitutionPolicy.canRead(actor, institution));

  return institution;
}

export const GetInstitution = { call };
