import { GET, POST } from "@/app/(server)/api/admin/institutions/route";
import { eq } from "drizzle-orm";
import { Database } from "@/lib/db/client";
import { institutions } from "@/lib/db/schema";
import { InstitutionFactory } from "@tests/integration/factories/institution.factory";
import { StudentFactory } from "@tests/integration/factories/student.factory";
import { UserFactory } from "@tests/integration/factories/user.factory";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationRoute } from "@tests/integration/helpers/integrationRoute";

describe("GET /api/admin/institutions", () => {
  describe("when unauthenticated", () => {
    beforeEach(async () => {
      await IntegrationDb.reset();
    });

    it("returns 401 when the session cookie is missing", async () => {
      const response = await GET(IntegrationRoute.request("/api/admin/institutions"));

      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ ok: false });
    });
  });

  describe("when authenticated", () => {
    let cookie: string;

    beforeEach(async () => {
      await IntegrationDb.reset();
      await UserFactory.createAdmin();
      ({ cookie } = await IntegrationRoute.signInAsAdmin());
    });

    it("returns paginated institutions with student counts from the database", async () => {
      const older = await InstitutionFactory.create({
        name: "Universidad Norte Integración",
        contactEmail: "norte@integration.test",
      });
      await StudentFactory.create({
        institutionId: older.id,
        firstName: "Ana",
        lastName: "Uno",
        email: "ana.uno@integration.test",
        documentId: "9000000001",
      });
      await StudentFactory.create({
        institutionId: older.id,
        firstName: "Bruno",
        lastName: "Dos",
        email: "bruno.dos@integration.test",
        documentId: "9000000002",
      });
      const archived = await InstitutionFactory.create({
        name: "Colegio Archivado",
        contactEmail: "archivo@integration.test",
        status: "archived",
      });
      const newer = await InstitutionFactory.create({
        name: "Instituto Sur",
        contactEmail: "sur@integration.test",
      });

      const response = await GET(IntegrationRoute.request("/api/admin/institutions", { cookie }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        ok: true,
        pagination: { page: 1, pageSize: 20, total: 3 },
        data: [
          expect.objectContaining({
            id: newer.id,
            name: "Instituto Sur",
            studentCount: 0,
          }),
          expect.objectContaining({
            id: archived.id,
            name: "Colegio Archivado",
            status: "archived",
            studentCount: 0,
          }),
          expect.objectContaining({
            id: older.id,
            name: "Universidad Norte Integración",
            studentCount: 2,
          }),
        ],
      });
    });

    it("filters the list by status and search query parameters", async () => {
      const norte = await InstitutionFactory.create({
        name: "Universidad Norte Integración",
        contactEmail: "norte-filter@integration.test",
      });
      await StudentFactory.create({
        institutionId: norte.id,
        firstName: "Ana",
        lastName: "Uno",
        email: "ana.uno.filter@integration.test",
        documentId: "9000000001",
      });
      await StudentFactory.create({
        institutionId: norte.id,
        firstName: "Bruno",
        lastName: "Dos",
        email: "bruno.dos.filter@integration.test",
        documentId: "9000000002",
      });
      await InstitutionFactory.create({
        name: "Instituto Sur",
        contactEmail: "sur-filter@integration.test",
      });

      const response = await GET(
        IntegrationRoute.request("/api/admin/institutions?status=active&search=norte", { cookie }),
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        ok: true,
        pagination: { page: 1, pageSize: 20, total: 1 },
        data: [
          expect.objectContaining({
            id: norte.id,
            name: "Universidad Norte Integración",
            status: "active",
            studentCount: 2,
          }),
        ],
      });
    });
  });
});

describe("POST /api/admin/institutions", () => {
  describe("when unauthenticated", () => {
    beforeEach(async () => {
      await IntegrationDb.reset();
    });

    it("returns 401 when the session cookie is missing", async () => {
      const response = await POST(
        IntegrationRoute.request("/api/admin/institutions", {
          method: "POST",
          body: { name: "Nueva", contactEmail: "nueva@integration.test" },
        }),
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

    it("creates the institution in the database and returns 201", async () => {
      const body = {
        name: "Universidad Creada",
        contactEmail: "  Creada@Integration.TEST ",
      };

      const response = await POST(
        IntegrationRoute.request("/api/admin/institutions", { method: "POST", body, cookie }),
      );
      const json = await response.json();

      const [row] = await Database.get()
        .select()
        .from(institutions)
        .where(eq(institutions.contactEmail, "creada@integration.test"));

      expect(response.status).toBe(201);
      expect(json).toEqual({
        ok: true,
        data: expect.objectContaining({
          id: row?.id,
          name: "Universidad Creada",
          contactEmail: "creada@integration.test",
          status: "active",
          archivedAt: null,
        }),
      });
      expect(row).toMatchObject({
        name: "Universidad Creada",
        contactEmail: "creada@integration.test",
        status: "active",
      });
    });
  });
});
