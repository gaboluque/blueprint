import { GET, POST } from "@/app/(server)/api/admin/institutions/[id]/students/route";
import { eq } from "drizzle-orm";
import { Database } from "@/lib/db/client";
import { students } from "@/lib/db/schema";
import { InstitutionFactory } from "@tests/integration/factories/institution.factory";
import { StudentFactory } from "@tests/integration/factories/student.factory";
import { UserFactory } from "@tests/integration/factories/user.factory";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationRoute } from "@tests/integration/helpers/integrationRoute";

describe("GET /api/admin/institutions/[id]/students", () => {
  describe("when unauthenticated", () => {
    beforeEach(async () => {
      await IntegrationDb.reset();
    });

    it("returns 401 when the session cookie is missing", async () => {
      const institution = await InstitutionFactory.create();
      const context = IntegrationRoute.routeContext({ id: institution.id });

      const response = await GET(
        IntegrationRoute.request(`/api/admin/institutions/${institution.id}/students`),
        context,
      );

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

    it("returns students belonging to the institution from the database", async () => {
      const institution = await InstitutionFactory.create();
      const active = await StudentFactory.create({
        institutionId: institution.id,
        firstName: "Ana",
        lastName: "Lista",
        email: "ana.lista@integration.test",
        documentId: "9100000001",
      });
      await StudentFactory.create({
        institutionId: institution.id,
        firstName: "Bruno",
        lastName: "Inactivo",
        email: "bruno.inactivo@integration.test",
        documentId: "9100000002",
        status: "inactive",
      });
      const context = IntegrationRoute.routeContext({ id: institution.id });

      const response = await GET(
        IntegrationRoute.request(`/api/admin/institutions/${institution.id}/students?status=active`, { cookie }),
        context,
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        ok: true,
        pagination: { page: 1, pageSize: 20, total: 1 },
        data: [
          expect.objectContaining({
            id: active.id,
            firstName: "Ana",
            lastName: "Lista",
            email: "ana.lista@integration.test",
            status: "active",
          }),
        ],
      });
    });

    it("returns 404 when the institution id does not exist", async () => {
      const missingId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
      const context = IntegrationRoute.routeContext({ id: missingId });

      const response = await GET(
        IntegrationRoute.request(`/api/admin/institutions/${missingId}/students`, { cookie }),
        context,
      );

      expect(response.status).toBe(404);
    });
  });
});

describe("POST /api/admin/institutions/[id]/students", () => {
  let cookie: string;

  beforeEach(async () => {
    await IntegrationDb.reset();
    await UserFactory.createAdmin();
    ({ cookie } = await IntegrationRoute.signInAsAdmin());
  });

  it("creates the student in the database and returns 201", async () => {
    const institution = await InstitutionFactory.create();
    const context = IntegrationRoute.routeContext({ id: institution.id });
    const body = {
      firstName: "Carla",
      lastName: "Nueva",
      email: "  Carla.Nueva@Integration.TEST ",
      documentId: "9200000001",
    };

    const response = await POST(
      IntegrationRoute.request(`/api/admin/institutions/${institution.id}/students`, {
        method: "POST",
        cookie,
        body,
      }),
      context,
    );
    const json = await response.json();

    const [row] = await Database.get()
      .select()
      .from(students)
      .where(eq(students.email, "carla.nueva@integration.test"));

    expect(response.status).toBe(201);
    expect(json.data).toMatchObject({
      id: row?.id,
      firstName: "Carla",
      lastName: "Nueva",
      email: "carla.nueva@integration.test",
      institutionId: institution.id,
      status: "active",
    });
    expect(row).toMatchObject({
      institutionId: institution.id,
      firstName: "Carla",
      lastName: "Nueva",
      email: "carla.nueva@integration.test",
    });
  });

  it("returns 409 when the institution is archived", async () => {
    const institution = await InstitutionFactory.create({ status: "archived" });
    const context = IntegrationRoute.routeContext({ id: institution.id });

    const response = await POST(
      IntegrationRoute.request(`/api/admin/institutions/${institution.id}/students`, {
        method: "POST",
        cookie,
        body: {
          firstName: "X",
          lastName: "Y",
          email: "xy@integration.test",
          documentId: "9200000002",
        },
      }),
      context,
    );

    expect(response.status).toBe(409);
  });
});
