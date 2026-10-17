import { ApiResponse } from "@/lib/http/apiResponse";

describe("ApiResponse", () => {
  it("wraps data in a 200 success envelope", async () => {
    const response = ApiResponse.success({ id: "1" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { id: "1" } });
  });

  it("returns 201 for created resources", async () => {
    const response = ApiResponse.created({ id: "1" });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, data: { id: "1" } });
  });

  it("puts pagination at the top level next to the rows", async () => {
    const response = ApiResponse.paginated([{ id: "1" }], { page: 1, pageSize: 20, total: 1 });

    expect(await response.json()).toEqual({
      ok: true,
      data: [{ id: "1" }],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });
  });

  it("returns an empty 204", async () => {
    const response = ApiResponse.noContent();

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("includes field errors only when present", async () => {
    const withFields = ApiResponse.error("Revisa los datos enviados.", 400, { slug: "Inválido" });
    const withoutFields = ApiResponse.error("No encontramos la institución.", 404);

    expect(withFields.status).toBe(400);
    expect(await withFields.json()).toEqual({
      ok: false,
      error: "Revisa los datos enviados.",
      fieldErrors: { slug: "Inválido" },
    });
    expect(await withoutFields.json()).toEqual({ ok: false, error: "No encontramos la institución." });
  });
});
