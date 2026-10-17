import { GET } from "@/app/(server)/api/admin/me/route";
import { eq } from "drizzle-orm";
import { Database } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { INTEGRATION_ADMIN, UserFactory } from "@tests/integration/factories/user.factory";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationRoute } from "@tests/integration/helpers/integrationRoute";

describe("GET /api/admin/me", () => {
  describe("when unauthenticated", () => {
    beforeEach(async () => {
      await IntegrationDb.reset();
    });

    it("returns 401 when the session cookie is missing", async () => {
      const response = await GET(IntegrationRoute.request("/api/admin/me"));

      expect(response.status).toBe(401);
    });
  });

  describe("when authenticated", () => {
    let cookie: string;

    beforeEach(async () => {
      await IntegrationDb.reset();
      await UserFactory.createAdmin();
      ({ cookie } = await IntegrationRoute.signInAsAdmin());
    });

    it("returns the authenticated admin from the session", async () => {
      const [admin] = await Database.get()
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, INTEGRATION_ADMIN.email));

      const response = await GET(IntegrationRoute.request("/api/admin/me", { cookie }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        ok: true,
        data: {
          id: admin?.id,
          email: INTEGRATION_ADMIN.email,
          name: INTEGRATION_ADMIN.name,
          role: "admin",
        },
      });
    });
  });
});
