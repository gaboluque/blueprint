import { BaseRepo, type Row } from "@/lib/db/baseRepo";
import { institutionMembers } from "@/lib/db/schema";
import { InstitutionMember } from "./institutionMember.model";

export class InstitutionMembersRepo extends BaseRepo<typeof institutionMembers, InstitutionMember> {
  protected readonly table = institutionMembers;

  protected toModel(row: Row<typeof institutionMembers>): InstitutionMember {
    return new InstitutionMember(row);
  }

  findByUserId(userId: string): Promise<InstitutionMember | null> {
    return this.findBy({ userId });
  }
}
