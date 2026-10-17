import type { InstitutionMemberRole, UserRole } from "@/lib/db/schema";

export type Actor = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string | null;
  institutionRole: InstitutionMemberRole | null;
};

export type ActorMembership = {
  institutionId: string;
  institutionRole: InstitutionMemberRole;
};
