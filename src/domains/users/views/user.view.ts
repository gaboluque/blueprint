import type { Actor } from "@/lib/auth/actor";
import type { UserRole } from "@/lib/db/schema";

export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

function format(actor: Actor): UserDto {
  return { id: actor.id, email: actor.email, name: actor.name, role: actor.role };
}

export const UserView = { format };
