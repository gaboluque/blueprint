import { DELETE, POST } from "@/app/(server)/api/admin/sessions/route";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { InstitutionFactory } from "@tests/integration/factories/institution.factory";
import { InstitutionMemberFactory } from "@tests/integration/factories/institutionMember.factory";
import { INTEGRATION_ADMIN, UserFactory } from "@tests/integration/factories/user.factory";
import { IntegrationDb } from "@tests/integration/helpers/integrationDb";
import { IntegrationRoute } from "@tests/integration/helpers/integrationRoute";

describe("POST /api/admin/sessions", () => {
  beforeEach(async () => {
    await IntegrationDb.reset();
  });

  it("returns 401 when the password does not match the stored hash", async () => {
    await UserFactory.createAdmin();

    const response = await POST(
      IntegrationRoute.request("/api/admin/sessions", {
        method: "POST",
        body: { email: INTEGRATION_ADMIN.email, password: "wrong-password" },
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false });
  });

  it("returns 401 for institution staff even when credentials are valid", async () => {
    const institution = await InstitutionFactory.create({ slug: "staff-session-int" });
    const staff = await UserFactory.create({
      email: "staff.session@integration.test",
      password: "StaffSession123!",
      name: "Staff Session",
      role: "institution_staff",
    });
    await InstitutionMemberFactory.create({ institutionId: institution.id, userId: staff.id });

    const response = await POST(
      IntegrationRoute.request("/api/admin/sessions", {
        method: "POST",
        body: { email: "staff.session@integration.test", password: "StaffSession123!" },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 429 after too many sign-in attempts for the same email", async () => {
    await UserFactory.createAdmin();
    const attempt = () =>
      POST(
        IntegrationRoute.request("/api/admin/sessions", {
          method: "POST",
          body: { email: INTEGRATION_ADMIN.email, password: "wrong-password" },
        }),
      );

    for (let i = 0; i < 5; i += 1) await attempt();
    const response = await attempt();

    expect(response.status).toBe(429);
  });

  it("sets the session cookie and returns the admin user from the database", async () => {
    const admin = await UserFactory.createAdmin();

    const response = await POST(
      IntegrationRoute.request("/api/admin/sessions", {
        method: "POST",
        body: { email: INTEGRATION_ADMIN.email, password: INTEGRATION_ADMIN.password },
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain(`${SessionCookie.name}=`);
    expect(json).toEqual({
      ok: true,
      data: {
        id: admin.id,
        email: INTEGRATION_ADMIN.email,
        name: INTEGRATION_ADMIN.name,
        role: "admin",
      },
    });
  });
});

describe("DELETE /api/admin/sessions", () => {
  describe("when signed in", () => {
    let cookie: string;

    beforeEach(async () => {
      await IntegrationDb.reset();
      await UserFactory.createAdmin();
      ({ cookie } = await IntegrationRoute.signInAsAdmin());
    });

    it("clears the session cookie and returns 204", async () => {
      const response = await DELETE(IntegrationRoute.request("/api/admin/sessions", { method: "DELETE", cookie }));

      expect(response.status).toBe(204);
      expect(response.headers.get("set-cookie")).toContain(`${SessionCookie.name}=`);
    });
  });

  describe("when no session is present", () => {
    beforeEach(async () => {
      await IntegrationDb.reset();
    });

    it("returns 204 and clears the cookie", async () => {
      const response = await DELETE(IntegrationRoute.request("/api/admin/sessions", { method: "DELETE" }));

      expect(response.status).toBe(204);
      expect(response.headers.get("set-cookie")).toContain(`${SessionCookie.name}=`);
    });
  });
});
