import { Database } from "@/lib/db/client";
import { institutionMembers, type InstitutionMemberRole } from "@/lib/db/schema";

type CreateInstitutionMemberInput = {
  institutionId: string;
  userId: string;
  role?: InstitutionMemberRole;
};

async function create({ institutionId, userId, role = "admin" }: CreateInstitutionMemberInput) {
  const db = Database.get();
  const [row] = await db.insert(institutionMembers).values({ institutionId, userId, role }).returning();
  if (!row) throw new Error("InstitutionMemberFactory.create failed");
  return row;
}

export const InstitutionMemberFactory = { create };
