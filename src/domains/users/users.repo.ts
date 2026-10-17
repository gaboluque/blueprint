import { BaseRepo, type Row } from "@/lib/db/baseRepo";
import { users } from "@/lib/db/schema";
import { User } from "./user.model";

export class UsersRepo extends BaseRepo<typeof users, User> {
  protected readonly table = users;
  protected override readonly conflictMessage = "Ya existe un usuario con ese correo.";

  protected toModel(row: Row<typeof users>): User {
    return new User(row);
  }

  /** Emails are stored lowercase. */
  findByEmail(email: string): Promise<User | null> {
    return this.findBy({ email: email.trim().toLowerCase() });
  }
}
