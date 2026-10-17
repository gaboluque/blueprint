import type { Actor, ActorMembership } from "@/lib/auth/actor";
import type { Row } from "@/lib/db/baseRepo";
import { BaseModel } from "@/lib/db/baseModel";
import type { users } from "@/lib/db/schema";

export type UserProps = Row<typeof users>;

export interface User extends Readonly<UserProps> {}
export class User extends BaseModel<typeof users> {
  constructor(row: UserProps) {
    super(row);
  }

  isAdmin(): boolean {
    return this.role === "admin";
  }

  isInstitutionStaff(): boolean {
    return this.role === "institution_staff";
  }

  toActor(membership?: ActorMembership): Actor {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      institutionId: membership?.institutionId ?? null,
      institutionRole: membership?.institutionRole ?? null,
    };
  }
}
