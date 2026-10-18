import { DELETE, GET, PATCH } from "@/app/(server)/api/admin/students/[id]/route";
import { InstitutionErrors } from "@/domains/institutions/institution.errors";
import { DeactivateStudent } from "@/domains/students/services/deactivateStudent.service";
import { GetStudent } from "@/domains/students/services/getStudent.service";
import { UpdateStudent } from "@/domains/students/services/updateStudent.service";
import { StudentErrors, STUDENT_ERROR_MESSAGES } from "@/domains/students/student.errors";
import { StudentView } from "@/domains/students/views/student.view";
import { Database } from "@/lib/db/client";
import { buildAdminActor, buildStudent, STUDENT_ID } from "../../../../../factories/models";
import { AdminRouteKit } from "../adminRouteKit";

jest.mock("@/lib/auth/auth", () => jest.requireActual("../adminRouteKit").AdminRouteKit.authModule());
jest.mock("@/lib/db/client", () => jest.requireActual("../adminRouteKit").AdminRouteKit.dbClientModule());
jest.mock("@/domains/students/services/getStudent.service", () => ({ GetStudent: { call: jest.fn() } }));
jest.mock("@/domains/students/services/updateStudent.service", () => ({ UpdateStudent: { call: jest.fn() } }));
jest.mock("@/domains/students/services/deactivateStudent.service", () => ({
  DeactivateStudent: { call: jest.fn() },
}));

const PATH = `/api/admin/students/${STUDENT_ID}`;
const params = AdminRouteKit.context({ id: STUDENT_ID });

afterEach(() => jest.clearAllMocks());

describe("GET /api/admin/students/[id]", () => {
  it("returns the student DTO in the envelope", async () => {
    const student = buildStudent();
    jest.mocked(GetStudent.call).mockResolvedValue(student);

    const response = await GET(AdminRouteKit.request(PATH), params);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: StudentView.format(student) });
    expect(GetStudent.call).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), { id: STUDENT_ID });
  });

  it("returns 401 without a session and never calls the service", async () => {
    const response = await GET(AdminRouteKit.request(PATH, { token: null }), params);

    expect(response.status).toBe(401);
    expect(GetStudent.call).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-UUID id", async () => {
    const response = await GET(AdminRouteKit.request("/api/admin/students/x"), AdminRouteKit.context({ id: "x" }));

    expect(response.status).toBe(400);
    expect(Object.keys((await response.json()).fieldErrors)).toEqual(["id"]);
  });

  it("returns 404 when the student doesn't exist", async () => {
    jest.mocked(GetStudent.call).mockRejectedValue(StudentErrors.notFound());

    const response = await GET(AdminRouteKit.request(PATH), params);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: STUDENT_ERROR_MESSAGES.notFound });
  });
});

describe("PATCH /api/admin/students/[id]", () => {
  it("updates inside a transaction and returns the student DTO", async () => {
    const student = buildStudent({ lastName: "Renombrada" });
    jest.mocked(UpdateStudent.call).mockResolvedValue(student);

    const response = await PATCH(
      AdminRouteKit.request(PATH, { method: "PATCH", body: { lastName: " Renombrada " } }),
      params,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: StudentView.format(student) });
    expect(UpdateStudent.call).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), {
      id: STUDENT_ID,
      patch: { lastName: "Renombrada" },
    });
    expect(Database.get().transaction).toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    const response = await PATCH(
      AdminRouteKit.request(PATH, { method: "PATCH", body: { lastName: "X" }, token: null }),
      params,
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for privileged keys and empty bodies", async () => {
    const withInstitution = await PATCH(
      AdminRouteKit.request(PATH, { method: "PATCH", body: { lastName: "X", institutionId: STUDENT_ID } }),
      params,
    );
    const empty = await PATCH(AdminRouteKit.request(PATH, { method: "PATCH", body: {} }), params);

    expect(withInstitution.status).toBe(400);
    expect(Object.keys((await withInstitution.json()).fieldErrors)).toEqual(["institutionId"]);
    expect(empty.status).toBe(400);
    expect(UpdateStudent.call).not.toHaveBeenCalled();
  });

  it("returns 409 when the student's institution is archived", async () => {
    jest.mocked(UpdateStudent.call).mockRejectedValue(InstitutionErrors.archived());

    const response = await PATCH(AdminRouteKit.request(PATH, { method: "PATCH", body: { lastName: "X" } }), params);

    expect(response.status).toBe(409);
  });
});

describe("DELETE /api/admin/students/[id]", () => {
  it("deactivates inside a transaction and returns 200 with the inactive student", async () => {
    const student = buildStudent({ status: "inactive" });
    jest.mocked(DeactivateStudent.call).mockResolvedValue(student);

    const response = await DELETE(AdminRouteKit.request(PATH, { method: "DELETE" }), params);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: StudentView.format(student) });
    expect(DeactivateStudent.call).toHaveBeenCalledWith(expect.anything(), buildAdminActor(), { id: STUDENT_ID });
    expect(Database.get().transaction).toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    const response = await DELETE(AdminRouteKit.request(PATH, { method: "DELETE", token: null }), params);

    expect(response.status).toBe(401);
    expect(DeactivateStudent.call).not.toHaveBeenCalled();
  });

  it("returns 409 when the student is already inactive", async () => {
    jest.mocked(DeactivateStudent.call).mockRejectedValue(StudentErrors.alreadyInactive());

    const response = await DELETE(AdminRouteKit.request(PATH, { method: "DELETE" }), params);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: STUDENT_ERROR_MESSAGES.alreadyInactive });
  });
});
