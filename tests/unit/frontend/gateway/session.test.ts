import { AdminSession } from "@/frontend/gateway/session";
import { jsonResponse, mockFetch, requestOf } from "../../../helpers/fetchMock";

const admin = {
  id: "c3d4e5f6-0000-4000-8000-000000000001",
  email: "admin@ficticia.test",
  name: "Admin Prueba",
  role: "admin" as const,
};

describe("AdminSession", () => {
  it("signs in with POST to the sessions collection", async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: admin }, 201));

    const result = await AdminSession.signIn({ email: admin.email, password: "secreta" });

    expect(requestOf(fetchMock)).toEqual({
      url: "/api/admin/sessions",
      method: "POST",
      body: { email: admin.email, password: "secreta" },
    });
    expect(result).toEqual({ ok: true, data: admin });
  });

  it("returns the 401 message on wrong credentials", async () => {
    mockFetch(jsonResponse({ ok: false, error: "Correo o contraseña incorrectos." }, 401));

    const result = await AdminSession.signIn({ email: admin.email, password: "mala" });

    expect(result).toEqual({
      ok: false,
      status: 401,
      error: "Correo o contraseña incorrectos.",
      fieldErrors: undefined,
    });
  });

  it("resolves sign-out's 204 to null data", async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }));

    const result = await AdminSession.signOut();

    expect(requestOf(fetchMock)).toMatchObject({ url: "/api/admin/sessions", method: "DELETE" });
    expect(result).toEqual({ ok: true, data: null });
  });
});
