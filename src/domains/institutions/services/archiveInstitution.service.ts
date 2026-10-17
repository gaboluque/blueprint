import type { Actor } from "@/lib/auth/actor";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { Policy } from "@/lib/policy/policy";
import { InstitutionErrors } from "../institution.errors";
import type { Institution } from "../institution.model";
import { InstitutionPolicy } from "../institution.policy";

export type ArchiveInstitutionInput = { id: string };

/** Replaces delete: the institution becomes read-only and its students are kept. */
async function call(repos: AppRepos, actor: Actor, { id }: ArchiveInstitutionInput): Promise<Institution> {
  const institution = await repos.institutions.findById(id);
  if (!institution) throw InstitutionErrors.notFound();
  Policy.authorize(InstitutionPolicy.canArchive(actor, institution));

  const archived = await repos.institutions.update(id, institution.archive(new Date()));
  if (!archived) throw InstitutionErrors.notFound();
  return archived;
}

export const ArchiveInstitution = { call };
