import type { User } from "@/domains/users/user.model";
import type { Actor } from "./actor";
import type { AuthRepos } from "./auth.port";

async function resolve(repos: AuthRepos, user: User): Promise<Actor | null> {
  if (user.isAdmin()) return user.toActor();
  if (!user.isInstitutionStaff()) return null;

  const membership = await repos.institutionMembers.findByUserId(user.id);
  if (!membership) return null;

  return user.toActor({
    institutionId: membership.institutionId,
    institutionRole: membership.role,
  });
}

export const ActorResolver = { resolve };
