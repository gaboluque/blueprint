import { DELETE, GET, PATCH } from "@/app/(server)/api/admin/institutions/[id]/route";
import { InstitutionErrors, INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { ArchiveInstitution } from "@/domains/institutions/services/archiveInstitution.service";
import { GetInstitution } from "@/domains/institutions/services/getInstitution.service";
import { UpdateInstitution } from "@/domains/institutions/services/updateInstitution.service";
import {
  buildAdminActor,
  buildArchivedInstitution,
  buildInstitution,
  INSTITUTION_ID,
} from "../../../../../../factories/models";
import { RouteTestSupport } from "../routeTestSupport";

const mockAuthProvider = RouteTestSupport.authProvider();
const mockDb = RouteTestSupport.fakeDb();

jest.mock("@/lib/auth/auth", () => ({ Auth: { provider: () => mockAuthProvider } }));
jest.mock("@/lib/db/client", () => ({ Database: { get: () => mockDb } }));
jest.mock("@/domains/institutions/services/getInstitution.service", () => ({ GetInstitution: { call: jest.fn() } }));
jest.mock("@/domains/institutions/services/updateInstitution.service", () => ({
  UpdateInstitution: { call: jest.fn() },
}));
jest.mock("@/domains/institutions/services/archiveInstitution.service", () => ({
  ArchiveInstitution: { call: jest.fn() },
}));

const getInstitution = jest.mocked(GetInstitution.call);
const updateInstitution = jest.mocked(UpdateInstitution.call);
const archiveInstitution = jest.mocked(ArchiveInstitution.call);

const PATH = `/api/admin/institutions/${INSTITUTION_ID}`;
const CONTEXT = RouteTestSupport.routeContext({ id: INSTITUTION_ID });

beforeEach(() => jest.clearAllMocks());

describe("GET /api/admin/institutions/[id]", () => {
  it("returns 401 without a session and never loads", async () => {
    const response = await GET(RouteTestSupport.request(PATH, { signedIn: false }), CONTEXT);

    expect(response.status).toBe(401);
    expect(getInstitution).not.toHaveBeenCalled();
  });

  it("returns the institution dto", async () => {
    getInstitution.mockResolvedValue(buildInstitution());

    const response = await GET(RouteTestSupport.request(PATH), CONTEXT);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: {
        id: INSTITUTION_ID,
        name: "Universidad Ficticia",
        slug: "u-ficticia",
        contactEmail: "bienestar@ficticia.test",
        status: "active",
        archivedAt: null,
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-01-15T10:00:00.000Z",
      },
    });
    expect(getInstitution).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), { id: INSTITUTION_ID });
  });

  it("returns 400 when the id isn't a uuid", async () => {
    const response = await GET(
      RouteTestSupport.request("/api/admin/institutions/abc"),
      RouteTestSupport.routeContext({ id: "abc" }),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(Object.keys(json.fieldErrors)).toEqual(["id"]);
    expect(getInstitution).not.toHaveBeenCalled();
  });

  it("returns 404 when the institution doesn't exist", async () => {
    getInstitution.mockRejectedValue(InstitutionErrors.notFound());

    const response = await GET(RouteTestSupport.request(PATH), CONTEXT);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: INSTITUTION_ERROR_MESSAGES.notFound });
  });
});

describe("PATCH /api/admin/institutions/[id]", () => {
  it("returns 401 without a session and never updates", async () => {
    const response = await PATCH(
      RouteTestSupport.request(PATH, { method: "PATCH", body: { name: "Nueva" }, signedIn: false }),
      CONTEXT,
    );

    expect(response.status).toBe(401);
    expect(updateInstitution).not.toHaveBeenCalled();
  });

  it("updates inside a transaction with the id from the path", async () => {
    updateInstitution.mockResolvedValue(buildInstitution({ name: "Nueva" }));

    const response = await PATCH(
      RouteTestSupport.request(PATH, { method: "PATCH", body: { name: " Nueva ", slug: "U-Nueva" } }),
      CONTEXT,
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.name).toBe("Nueva");
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(updateInstitution).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), {
      id: INSTITUTION_ID,
      patch: { name: "Nueva", slug: "u-nueva" },
    });
  });

  it("returns 400 for an empty body or a privileged field", async () => {
    const empty = await PATCH(RouteTestSupport.request(PATH, { method: "PATCH", body: {} }), CONTEXT);
    const privileged = await PATCH(
      RouteTestSupport.request(PATH, { method: "PATCH", body: { archivedAt: "2026-01-01T00:00:00.000Z" } }),
      CONTEXT,
    );

    expect(empty.status).toBe(400);
    expect(privileged.status).toBe(400);
    expect(Object.keys((await privileged.json()).fieldErrors)).toContain("archivedAt");
    expect(updateInstitution).not.toHaveBeenCalled();
  });

  it("returns 409 when the institution is archived", async () => {
    updateInstitution.mockRejectedValue(InstitutionErrors.archived());

    const response = await PATCH(RouteTestSupport.request(PATH, { method: "PATCH", body: { name: "Nueva" } }), CONTEXT);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: INSTITUTION_ERROR_MESSAGES.archived });
  });
});

describe("DELETE /api/admin/institutions/[id]", () => {
  it("returns 401 without a session and never archives", async () => {
    const response = await DELETE(RouteTestSupport.request(PATH, { method: "DELETE", signedIn: false }), CONTEXT);

    expect(response.status).toBe(401);
    expect(archiveInstitution).not.toHaveBeenCalled();
  });

  it("archives inside a transaction and returns the archived dto", async () => {
    archiveInstitution.mockResolvedValue(buildArchivedInstitution());

    const response = await DELETE(RouteTestSupport.request(PATH, { method: "DELETE" }), CONTEXT);

    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ status: "archived", archivedAt: "2026-02-01T00:00:00.000Z" });
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(archiveInstitution).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), { id: INSTITUTION_ID });
  });

  it("returns 409 when the institution is already archived", async () => {
    archiveInstitution.mockRejectedValue(InstitutionErrors.alreadyArchived());

    const response = await DELETE(RouteTestSupport.request(PATH, { method: "DELETE" }), CONTEXT);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: INSTITUTION_ERROR_MESSAGES.alreadyArchived });
  });
});
