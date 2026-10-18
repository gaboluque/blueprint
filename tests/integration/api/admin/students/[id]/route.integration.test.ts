import { DELETE, GET, PATCH } from "@/app/(server)/api/admin/students/[id]/route";
import { eq } from "drizzle-orm";
import { Database } from "@/lib/db/client";
import { students } from "@/lib/db/schema";
import { InstitutionFactory } from "@tests/integration/factories/institution.factory";
import { StudentFactory } from "@tests/integration/factories/student.factory";
import { UserFactory } from "@tests/integration/factories/user.factory";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationRoute } from "@tests/integration/helpers/integrationRoute";

describe("GET /api/admin/students/[id]", () => {
  describe("when unauthenticated", () => {
    beforeEach(async () => {
      await IntegrationDb.reset();
    });

    it("returns 401 when the session cookie is missing", async () => {
      const institution = await InstitutionFactory.create();
      const student = await StudentFactory.create({ institutionId: institution.id });
      const context = IntegrationRoute.routeContext({ id: student.id });

      const response = await GET(IntegrationRoute.request(`/api/admin/students/${student.id}`), context);

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

    it("returns the student stored in the database", async () => {
      const institution = await InstitutionFactory.create();
      const student = await StudentFactory.create({
        institutionId: institution.id,
        firstName: "Diana",
        lastName: "Detalle",
        email: "diana.detalle@integration.test",
        documentId: "9300000001",
      });
      const context = IntegrationRoute.routeContext({ id: student.id });

      const response = await GET(IntegrationRoute.request(`/api/admin/students/${student.id}`, { cookie }), context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        ok: true,
        data: expect.objectContaining({
          id: student.id,
          firstName: "Diana",
          lastName: "Detalle",
          email: "diana.detalle@integration.test",
          institutionId: institution.id,
          status: "active",
        }),
      });
    });

    it("returns 404 when the student id does not exist", async () => {
      const missingId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
      const context = IntegrationRoute.routeContext({ id: missingId });

      const response = await GET(IntegrationRoute.request(`/api/admin/students/${missingId}`, { cookie }), context);

      expect(response.status).toBe(404);
    });
  });
});

describe("PATCH /api/admin/students/[id]", () => {
  let cookie: string;

  beforeEach(async () => {
    await IntegrationDb.reset();
    await UserFactory.createAdmin();
    ({ cookie } = await IntegrationRoute.signInAsAdmin());
  });

  it("persists the patch and returns the updated student", async () => {
    const institution = await InstitutionFactory.create();
    const student = await StudentFactory.create({
      institutionId: institution.id,
      lastName: "Antes",
      email: "patch.student@integration.test",
    });
    const context = IntegrationRoute.routeContext({ id: student.id });

    const response = await PATCH(
      IntegrationRoute.request(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        cookie,
        body: { lastName: " Después " },
      }),
      context,
    );
    const json = await response.json();

    const [row] = await Database.get().select().from(students).where(eq(students.id, student.id));

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({ lastName: "Después" });
    expect(row?.lastName).toBe("Después");
  });

  it("returns 409 when the student's institution is archived", async () => {
    const institution = await InstitutionFactory.create({ status: "archived" });
    const student = await StudentFactory.create({ institutionId: institution.id });
    const context = IntegrationRoute.routeContext({ id: student.id });

    const response = await PATCH(
      IntegrationRoute.request(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        cookie,
        body: { lastName: "Bloqueado" },
      }),
      context,
    );

    expect(response.status).toBe(409);
  });
});

describe("DELETE /api/admin/students/[id]", () => {
  let cookie: string;

  beforeEach(async () => {
    await IntegrationDb.reset();
    await UserFactory.createAdmin();
    ({ cookie } = await IntegrationRoute.signInAsAdmin());
  });

  it("deactivates the student in the database", async () => {
    const institution = await InstitutionFactory.create();
    const student = await StudentFactory.create({ institutionId: institution.id });
    const context = IntegrationRoute.routeContext({ id: student.id });

    const response = await DELETE(
      IntegrationRoute.request(`/api/admin/students/${student.id}`, { method: "DELETE", cookie }),
      context,
    );
    const json = await response.json();

    const [row] = await Database.get().select().from(students).where(eq(students.id, student.id));

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({ id: student.id, status: "inactive" });
    expect(row?.status).toBe("inactive");
  });

  it("returns 409 when the student is already inactive", async () => {
    const institution = await InstitutionFactory.create();
    const student = await StudentFactory.create({ institutionId: institution.id, status: "inactive" });
    const context = IntegrationRoute.routeContext({ id: student.id });

    const response = await DELETE(
      IntegrationRoute.request(`/api/admin/students/${student.id}`, { method: "DELETE", cookie }),
      context,
    );

    expect(response.status).toBe(409);
  });
});
