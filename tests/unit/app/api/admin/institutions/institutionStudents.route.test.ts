import { GET, POST } from "@/app/(server)/api/admin/institutions/[id]/students/route";
import { InstitutionErrors, INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { CreateStudent } from "@/domains/students/services/createStudent.service";
import { ListInstitutionStudents } from "@/domains/students/services/listInstitutionStudents.service";
import { StudentErrors } from "@/domains/students/student.errors";
import { StudentView } from "@/domains/students/views/student.view";
import { Database } from "@/lib/db/client";
import { buildAdminActor, buildStudent, INSTITUTION_ID } from "../../../../../factories/models";
import { AdminRouteKit } from "../adminRouteKit";

jest.mock("@/lib/auth/auth", () => jest.requireActual("../adminRouteKit").AdminRouteKit.authModule());
jest.mock("@/lib/db/client", () => jest.requireActual("../adminRouteKit").AdminRouteKit.dbClientModule());
jest.mock("@/domains/students/services/listInstitutionStudents.service", () => ({
  ListInstitutionStudents: { call: jest.fn() },
}));
jest.mock("@/domains/students/services/createStudent.service", () => ({ CreateStudent: { call: jest.fn() } }));

const PATH = `/api/admin/institutions/${INSTITUTION_ID}/students`;
const params = AdminRouteKit.context({ id: INSTITUTION_ID });
const BODY = {
  firstName: "Ana",
  lastName: "Prueba",
  email: " Ana.Prueba@Ficticia.test ",
  documentId: "1000000001",
};

afterEach(() => jest.clearAllMocks());

describe("GET /api/admin/institutions/[id]/students", () => {
  it("returns a paginated envelope of student DTOs with parsed filters", async () => {
    const student = buildStudent();
    jest.mocked(ListInstitutionStudents.call).mockResolvedValue({ items: [student], page: 2, pageSize: 5, total: 6 });

    const response = await GET(
      AdminRouteKit.request(`${PATH}?page=2&pageSize=5&search=%20ana%20&status=active`),
      params,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: [StudentView.format(student)],
      pagination: { page: 2, pageSize: 5, total: 6 },
    });
    expect(ListInstitutionStudents.call).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), {
      institutionId: INSTITUTION_ID,
      query: { page: 2, pageSize: 5, search: "ana", status: "active" },
    });
  });

  it("returns 401 without a session and never calls the service", async () => {
    const response = await GET(AdminRouteKit.request(PATH, { token: null }), params);

    expect(response.status).toBe(401);
    expect(ListInstitutionStudents.call).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown status filter", async () => {
    const response = await GET(AdminRouteKit.request(`${PATH}?status=deleted`), params);

    expect(response.status).toBe(400);
    expect(Object.keys((await response.json()).fieldErrors)).toEqual(["status"]);
  });

  it("returns 404 when the institution doesn't exist", async () => {
    jest.mocked(ListInstitutionStudents.call).mockRejectedValue(InstitutionErrors.notFound());

    const response = await GET(AdminRouteKit.request(PATH), params);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: INSTITUTION_ERROR_MESSAGES.notFound });
  });
});

describe("POST /api/admin/institutions/[id]/students", () => {
  it("creates inside a transaction and returns 201 with the student DTO", async () => {
    const student = buildStudent();
    jest.mocked(CreateStudent.call).mockResolvedValue(student);

    const response = await POST(AdminRouteKit.request(PATH, { method: "POST", body: BODY }), params);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, data: StudentView.format(student) });
    expect(CreateStudent.call).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), {
      institutionId: INSTITUTION_ID,
      body: { ...BODY, email: "ana.prueba@ficticia.test", status: "active" },
    });
    expect(Database.get().transaction).toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    const response = await POST(AdminRouteKit.request(PATH, { method: "POST", body: BODY, token: null }), params);

    expect(response.status).toBe(401);
    expect(CreateStudent.call).not.toHaveBeenCalled();
  });

  it("returns 400 naming an institutionId sent in the body", async () => {
    const response = await POST(
      AdminRouteKit.request(PATH, { method: "POST", body: { ...BODY, institutionId: INSTITUTION_ID } }),
      params,
    );

    expect(response.status).toBe(400);
    expect(Object.keys((await response.json()).fieldErrors)).toEqual(["institutionId"]);
    expect(CreateStudent.call).not.toHaveBeenCalled();
  });

  it("returns 409 when the email is taken", async () => {
    jest.mocked(CreateStudent.call).mockRejectedValue(StudentErrors.emailTaken());

    const response = await POST(AdminRouteKit.request(PATH, { method: "POST", body: BODY }), params);

    expect(response.status).toBe(409);
  });
});
