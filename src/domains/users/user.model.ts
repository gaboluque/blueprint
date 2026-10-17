import type { Actor } from "@/lib/auth/actor";
import type { UserRole } from "@/lib/db/schema";

export type UserProps = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  /** Never leaves the server; views must not include it. */
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.role = props.role;
    this.passwordHash = props.passwordHash;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isAdmin(): boolean {
    return this.role === "admin";
  }

  toActor(): Actor {
    return { id: this.id, email: this.email, name: this.name, role: this.role };
  }
}
