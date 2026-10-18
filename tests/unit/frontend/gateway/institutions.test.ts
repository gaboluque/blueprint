import { AdminInstitutions } from "@/frontend/gateway/institutions";
import { institutionDto, institutionListItemDto, studentDto } from "../../../factories/dtos";
import { jsonResponse, mockFetch, requestOf } from "../../../helpers/fetchMock";

const institution = institutionDto();

describe("AdminInstitutions", () => {
  it("lists institutions with filters in the query string and returns top-level pagination", async () => {
    const pagination = { page: 2, pageSize: 20, total: 21 };
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: [institutionListItemDto()], pagination }));

    const result = await AdminInstitutions.list({ page: 2, pageSize: 20, search: "norte", status: "archived" });

    expect(requestOf(fetchMock)).toEqual({
      url: "/api/admin/institutions?page=2&pageSize=20&search=norte&status=archived",
      method: "GET",
      body: undefined,
    });
    expect(result).toEqual({ ok: true, data: [institutionListItemDto()], pagination });
  });

  it("omits blank filters from the query string", async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: [], pagination: { page: 1, pageSize: 20, total: 0 } }));

    await AdminInstitutions.list({ page: 1, pageSize: 20, search: undefined });

    expect(requestOf(fetchMock).url).toBe("/api/admin/institutions?page=1&pageSize=20");
  });

  it("creates an institution and surfaces field errors on conflict", async () => {
    const body = { name: "Nueva", contactEmail: "a@ficticia.test" };
    const fetchMock = mockFetch(
      jsonResponse(
        {
          ok: false,
          error: "A record with those values already exists.",
          fieldErrors: { contactEmail: "Already exists." },
        },
        409,
      ),
    );

    const result = await AdminInstitutions.create(body);

    expect(requestOf(fetchMock)).toEqual({ url: "/api/admin/institutions", method: "POST", body });
    expect(result).toEqual({
      ok: false,
      status: 409,
      error: "A record with those values already exists.",
      fieldErrors: { contactEmail: "Already exists." },
    });
  });

  it("updates an institution with PATCH on the item path", async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: institution }));

    const result = await AdminInstitutions.update(institution.id, { name: "Renombrada" });

    expect(requestOf(fetchMock)).toEqual({
      url: `/api/admin/institutions/${institution.id}`,
      method: "PATCH",
      body: { name: "Renombrada" },
    });
    expect(result).toEqual({ ok: true, data: institution });
  });

  it("archives with DELETE and returns the archived institution", async () => {
    const archived = institutionDto({ status: "archived", archivedAt: "2026-02-01T10:00:00.000Z" });
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: archived }));

    const result = await AdminInstitutions.archive(institution.id);

    expect(requestOf(fetchMock)).toMatchObject({ url: `/api/admin/institutions/${institution.id}`, method: "DELETE" });
    expect(result).toEqual({ ok: true, data: archived });
  });

  it("lists students under the institution path", async () => {
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: [], pagination: { page: 1, pageSize: 20, total: 0 } }));

    await AdminInstitutions.listStudents(institution.id, {
      page: 1,
      pageSize: 20,
      search: undefined,
      status: "inactive",
    });

    expect(requestOf(fetchMock).url).toBe(
      `/api/admin/institutions/${institution.id}/students?page=1&pageSize=20&status=inactive`,
    );
  });

  it("creates a student under the institution path", async () => {
    const student = studentDto();
    const fetchMock = mockFetch(jsonResponse({ ok: true, data: student }, 201));
    const body = {
      firstName: "Ana",
      lastName: "Prueba",
      email: student.email,
      documentId: "1",
      status: "active" as const,
    };

    const result = await AdminInstitutions.createStudent(institution.id, body);

    expect(requestOf(fetchMock)).toEqual({
      url: `/api/admin/institutions/${institution.id}/students`,
      method: "POST",
      body,
    });
    expect(result).toEqual({ ok: true, data: student });
  });

  it("returns a network error instead of throwing when the request fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await AdminInstitutions.get(institution.id);

    expect(result).toEqual({ ok: false, status: 0, error: "Couldn't reach the server. Check your connection." });
  });
});
