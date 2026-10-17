/** Extend when new roles can sign in to other surfaces. */
export type UserRole = "admin";

export type Actor = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
