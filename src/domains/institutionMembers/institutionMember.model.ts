import type { Row } from "@/lib/db/baseRepo";
import { BaseModel } from "@/lib/db/baseModel";
import type { institutionMembers } from "@/lib/db/schema";

export type InstitutionMemberProps = Row<typeof institutionMembers>;

export interface InstitutionMember extends Readonly<InstitutionMemberProps> {}
export class InstitutionMember extends BaseModel<typeof institutionMembers> {
  constructor(row: InstitutionMemberProps) {
    super(row);
  }
}
