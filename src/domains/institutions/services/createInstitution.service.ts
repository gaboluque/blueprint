import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import type { Institution } from "../institution.model";
import { InstitutionPolicy } from "../institution.policy";
import type { CreateInstitutionBody } from "../validations/institution.validation";

async function call(repos: AppRepos, actor: Actor, input: CreateInstitutionBody): Promise<Institution> {
  Policy.authorize(InstitutionPolicy.canCreate(actor));

  return repos.institutions.create(input);
}

export const CreateInstitution = { call };
