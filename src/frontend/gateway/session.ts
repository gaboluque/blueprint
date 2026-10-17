import type { UserDto } from "@/domains/users/views/user.view";
import type { SignInBody } from "@/lib/auth/auth.validation";
import { ApiClient } from "./apiClient";

const SESSIONS_PATH = "/api/admin/sessions";
const ME_PATH = "/api/admin/me";

export const AdminSession = {
  signIn: (body: SignInBody) => ApiClient.post<UserDto>(SESSIONS_PATH, body),
  signOut: () => ApiClient.delete<null>(SESSIONS_PATH),
  me: () => ApiClient.get<UserDto>(ME_PATH),
};
