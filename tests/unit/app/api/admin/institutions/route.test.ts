import { GET, POST } from "@/app/(server)/api/admin/institutions/route";
import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { CreateInstitution } from "@/domains/institutions/services/createInstitution.service";
import { ListInstitutions } from "@/domains/institutions/services/listInstitutions.service";
import { ConflictError } from "@/lib/errors/domain.errors";
import { buildAdminActor, buildInstitution, INSTITUTION_ID } from "../../../../../factories/models";
import { RouteTestSupport } from "./routeTestSupport";

const mockAuthProvider = RouteTestSupport.authProvider();
const mockDb = RouteTestSupport.fakeDb();

jest.mock("@/lib/auth/auth", () => ({ Auth: { provider: () => mockAuthProvider } }));
jest.mock("@/lib/db/client", () => ({ Database: { get: () => mockDb } }));
jest.mock("@/domains/institutions/services/listInstitutions.service", () => ({
  ListInstitutions: { call: jest.fn() },
}));
jest.mock("@/domains/institutions/services/createInstitution.service", () => ({
  CreateInstitution: { call: jest.fn() },
}));

const listInstitutions = jest.mocked(ListInstitutions.call);
const createInstitution = jest.mocked(CreateInstitution.call);

const INSTITUTION_DTO = {
  id: INSTITUTION_ID,
  name: "Universidad Ficticia",
  slug: "u-ficticia",
  contactEmail: "bienestar@ficticia.test",
  status: "active",
  archivedAt: null,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
};
const CREATE_BODY = { name: "Universidad Ficticia", slug: "u-ficticia", contactEmail: "bienestar@ficticia.test" };

beforeEach(() => jest.clearAllMocks());

describe("GET /api/admin/institutions", () => {
  it("returns 401 without a session and never lists", async () => {
    const response = await GET(RouteTestSupport.request("/api/admin/institutions", { signedIn: false }));

    expect(response.status).toBe(401);
    expect(listInstitutions).not.toHaveBeenCalled();
  });

  it("returns the page of institutions with student counts and pagination", async () => {
    listInstitutions.mockResolvedValue({
      items: [{ institution: buildInstitution(), studentCount: 4 }],
      page: 2,
      pageSize: 5,
      total: 6,
    });

    const response = await GET(
      RouteTestSupport.request("/api/admin/institutions?page=2&pageSize=5&search=%20ficticia%20&status=active"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: [{ ...INSTITUTION_DTO, studentCount: 4 }],
      pagination: { page: 2, pageSize: 5, total: 6 },
    });
    expect(listInstitutions).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), {
      page: 2,
      pageSize: 5,
      search: "ficticia",
      status: "active",
    });
  });

  it("applies default paging and no filters when the query is empty", async () => {
    listInstitutions.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });

    await GET(RouteTestSupport.request("/api/admin/institutions?search="));

    expect(listInstitutions).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), {
      page: 1,
      pageSize: 20,
      search: undefined,
    });
  });

  it("returns 400 for an unknown status or an oversized page", async () => {
    const response = await GET(RouteTestSupport.request("/api/admin/institutions?status=deleted&pageSize=500"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(Object.keys(json.fieldErrors).sort()).toEqual(["pageSize", "status"]);
    expect(listInstitutions).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/institutions", () => {
  it("returns 401 without a session and never creates", async () => {
    const response = await POST(
      RouteTestSupport.request("/api/admin/institutions", { method: "POST", body: CREATE_BODY, signedIn: false }),
    );

    expect(response.status).toBe(401);
    expect(createInstitution).not.toHaveBeenCalled();
  });

  it("creates the institution inside a transaction and returns 201 with the dto", async () => {
    createInstitution.mockResolvedValue(buildInstitution());

    const response = await POST(
      RouteTestSupport.request("/api/admin/institutions", {
        method: "POST",
        body: { ...CREATE_BODY, contactEmail: "  Bienestar@Ficticia.TEST " },
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, data: INSTITUTION_DTO });
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(createInstitution).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), CREATE_BODY);
  });

  it("returns 400 when the body sets a privileged field", async () => {
    const response = await POST(
      RouteTestSupport.request("/api/admin/institutions", {
        method: "POST",
        body: { ...CREATE_BODY, status: "archived" },
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(Object.keys(json.fieldErrors)).toEqual(["status"]);
    expect(createInstitution).not.toHaveBeenCalled();
  });

  it("returns 409 when the slug is taken", async () => {
    createInstitution.mockRejectedValue(new ConflictError(INSTITUTION_ERROR_MESSAGES.slugTaken));

    const response = await POST(
      RouteTestSupport.request("/api/admin/institutions", { method: "POST", body: CREATE_BODY }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: INSTITUTION_ERROR_MESSAGES.slugTaken });
  });
});
