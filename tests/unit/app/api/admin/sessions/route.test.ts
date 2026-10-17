import { DELETE, POST } from "@/app/(server)/api/admin/sessions/route";
import type { AuthSession } from "@/lib/auth/auth.port";
import { SessionCookie } from "@/lib/auth/sessionCookie";
import { RouteTestSupport } from "../institutions/routeTestSupport";
import { buildAdminActor, buildInstitutionStaffActor } from "../../../../../factories/models";

const mockAuthProvider = RouteTestSupport.authProvider();
const mockDb = RouteTestSupport.fakeDb();
const mockRecord = jest.fn();

jest.mock("@/lib/auth/auth", () => ({ Auth: { provider: () => mockAuthProvider } }));
jest.mock("@/lib/db/client", () => ({ Database: { get: () => mockDb } }));
jest.mock("@/domains/audit/auditEvents.repo", () => ({
  AuditEventsRepo: class {
    record = mockRecord;
  },
}));

const PATH = "/api/admin/sessions";

beforeEach(() => jest.clearAllMocks());

describe("POST /api/admin/sessions", () => {
  it("records a signed_in audit event when credentials match", async () => {
    const actor = buildAdminActor();
    const session: AuthSession = { actor, token: "token", expiresAt: new Date("2027-01-01T00:00:00.000Z") };
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(session);

    const response = await POST(
      RouteTestSupport.request(PATH, {
        method: "POST",
        body: { email: actor.email, password: "secreta" },
        signedIn: false,
      }),
    );

    expect(response.status).toBe(201);
    expect(mockRecord).toHaveBeenCalledWith({ entityType: "user", verb: "signed_in", entityId: actor.id });
  });

  it("rejects institution staff even when credentials match", async () => {
    const actor = buildInstitutionStaffActor();
    const session: AuthSession = { actor, token: "token", expiresAt: new Date("2027-01-01T00:00:00.000Z") };
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(session);

    const response = await POST(
      RouteTestSupport.request(PATH, {
        method: "POST",
        body: { email: actor.email, password: "secreta" },
        signedIn: false,
      }),
    );

    expect(response.status).toBe(401);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("does not record an event when credentials are rejected", async () => {
    (mockAuthProvider.signIn as jest.Mock).mockResolvedValue(null);

    const response = await POST(
      RouteTestSupport.request(PATH, {
        method: "POST",
        body: { email: "admin@saludamente.test", password: "mala" },
        signedIn: false,
      }),
    );

    expect(response.status).toBe(401);
    expect(mockRecord).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/sessions", () => {
  it("records a signed_out event when the cookie resolves to an actor and always clears the cookie", async () => {
    const response = await DELETE(RouteTestSupport.request(PATH, { method: "DELETE" }));

    expect(response.status).toBe(204);
    expect(mockRecord).toHaveBeenCalledWith({
      entityType: "user",
      verb: "signed_out",
      entityId: buildAdminActor().id,
    });
    expect(response.headers.get("set-cookie")).toContain(`${SessionCookie.name}=`);
  });

  it("skips the audit write but still clears the cookie when there is no session", async () => {
    const response = await DELETE(RouteTestSupport.request(PATH, { method: "DELETE", signedIn: false }));

    expect(response.status).toBe(204);
    expect(mockRecord).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain(`${SessionCookie.name}=`);
  });
});
