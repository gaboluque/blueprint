import { DELETE, GET, PATCH } from "@/app/(server)/api/admin/institutions/[id]/route";
import { eq } from "drizzle-orm";
import { Database } from "@/lib/db/client";
import { institutions } from "@/lib/db/schema";
import { InstitutionFactory } from "@tests/integration/factories/institution.factory";
import { UserFactory } from "@tests/integration/factories/user.factory";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationRoute } from "@tests/integration/helpers/integrationRoute";

describe("GET /api/admin/institutions/[id]", () => {
  describe("when unauthenticated", () => {
    beforeEach(async () => {
      await IntegrationDb.reset();
    });

    it("returns 401 when the session cookie is missing", async () => {
      const institution = await InstitutionFactory.create({ slug: "get-int" });
      const context = IntegrationRoute.routeContext({ id: institution.id });

      const response = await GET(IntegrationRoute.request(`/api/admin/institutions/${institution.id}`), context);

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

    it("returns the institution stored in the database", async () => {
      const institution = await InstitutionFactory.create({
        name: "Detalle Integración",
        slug: "detalle-int",
        contactEmail: "detalle@integration.test",
      });
      const context = IntegrationRoute.routeContext({ id: institution.id });

      const response = await GET(
        IntegrationRoute.request(`/api/admin/institutions/${institution.id}`, { cookie }),
        context,
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        ok: true,
        data: expect.objectContaining({
          id: institution.id,
          name: "Detalle Integración",
          slug: "detalle-int",
          contactEmail: "detalle@integration.test",
          status: "active",
        }),
      });
    });

    it("returns 404 when the institution id does not exist", async () => {
      const missingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const context = IntegrationRoute.routeContext({ id: missingId });

      const response = await GET(IntegrationRoute.request(`/api/admin/institutions/${missingId}`, { cookie }), context);

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ ok: false });
    });
  });
});

describe("PATCH /api/admin/institutions/[id]", () => {
  let cookie: string;

  beforeEach(async () => {
    await IntegrationDb.reset();
    await UserFactory.createAdmin();
    ({ cookie } = await IntegrationRoute.signInAsAdmin());
  });

  it("persists the patch and returns the updated institution", async () => {
    const institution = await InstitutionFactory.create({ slug: "patch-int", name: "Antes" });
    const context = IntegrationRoute.routeContext({ id: institution.id });

    const response = await PATCH(
      IntegrationRoute.request(`/api/admin/institutions/${institution.id}`, {
        method: "PATCH",
        cookie,
        body: { name: " Después ", slug: "PATCH-INT" },
      }),
      context,
    );
    const json = await response.json();

    const [row] = await Database.get().select().from(institutions).where(eq(institutions.id, institution.id));

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({ name: "Después", slug: "patch-int" });
    expect(row).toMatchObject({ name: "Después", slug: "patch-int" });
  });

  it("returns 409 when the institution is archived", async () => {
    const institution = await InstitutionFactory.create({
      slug: "archived-patch-int",
      status: "archived",
    });
    const context = IntegrationRoute.routeContext({ id: institution.id });

    const response = await PATCH(
      IntegrationRoute.request(`/api/admin/institutions/${institution.id}`, {
        method: "PATCH",
        cookie,
        body: { name: "No permitido" },
      }),
      context,
    );

    expect(response.status).toBe(409);
  });
});

describe("DELETE /api/admin/institutions/[id]", () => {
  let cookie: string;

  beforeEach(async () => {
    await IntegrationDb.reset();
    await UserFactory.createAdmin();
    ({ cookie } = await IntegrationRoute.signInAsAdmin());
  });

  it("archives the institution in the database", async () => {
    const institution = await InstitutionFactory.create({ slug: "archive-int" });
    const context = IntegrationRoute.routeContext({ id: institution.id });

    const response = await DELETE(
      IntegrationRoute.request(`/api/admin/institutions/${institution.id}`, { method: "DELETE", cookie }),
      context,
    );
    const json = await response.json();

    const [row] = await Database.get().select().from(institutions).where(eq(institutions.id, institution.id));

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({ id: institution.id, status: "archived" });
    expect(row?.status).toBe("archived");
    expect(row?.archivedAt).not.toBeNull();
  });

  it("returns 409 when the institution is already archived", async () => {
    const institution = await InstitutionFactory.create({ slug: "already-archived-int", status: "archived" });
    const context = IntegrationRoute.routeContext({ id: institution.id });

    const response = await DELETE(
      IntegrationRoute.request(`/api/admin/institutions/${institution.id}`, { method: "DELETE", cookie }),
      context,
    );

    expect(response.status).toBe(409);
  });
});
