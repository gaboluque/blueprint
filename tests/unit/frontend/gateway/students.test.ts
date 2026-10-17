import { AdminStudents } from "@/frontend/gateway/students";
import { studentDto } from "../../../factories/dtos";
import { jsonResponse, mockFetch, requestOf } from "../../../helpers/fetchMock";

const student = studentDto();

describe("AdminStudents", () => {
  it("gets a student by id", async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: student }));

    const result = await AdminStudents.get(student.id);

    expect(requestOf(fetchMock)).toMatchObject({ url: `/api/admin/students/${student.id}`, method: "GET" });
    expect(result).toEqual({ ok: true, data: student });
  });

  it("returns 409 when updating a student of an archived institution", async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: false, error: "La institución está archivada." }, 409));

    const result = await AdminStudents.update(student.id, { email: "otra@ficticia.test" });

    expect(requestOf(fetchMock)).toEqual({
      url: `/api/admin/students/${student.id}`,
      method: "PATCH",
      body: { email: "otra@ficticia.test" },
    });
    expect(result).toEqual({ ok: false, status: 409, error: "La institución está archivada.", fieldErrors: undefined });
  });

  it("deactivates with DELETE and returns the inactive student", async () => {
    const inactive = studentDto({ status: "inactive" });
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: inactive }));

    const result = await AdminStudents.deactivate(student.id);

    expect(requestOf(fetchMock)).toMatchObject({ url: `/api/admin/students/${student.id}`, method: "DELETE" });
    expect(result).toEqual({ ok: true, data: inactive });
  });
});
