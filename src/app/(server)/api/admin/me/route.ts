import { UserView } from "@/domains/users/views/user.view";
import { AdminApiHandler } from "@/lib/http/adminApiHandler";

export const runtime = "nodejs";

export const GET = AdminApiHandler(async ({ actor }) => UserView.format(actor), {
  route: "GET /api/admin/me",
  fallbackError: "No pudimos cargar tu perfil.",
});
