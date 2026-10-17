import {
  ConflictError,
  ForbiddenError,
  InputParseError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableError,
} from "@/lib/errors/domain.errors";
import { ErrorMapping } from "@/lib/errors/errorMapping";
import { HttpError } from "@/lib/errors/http.errors";

const FALLBACK = "No pudimos completar la solicitud.";

describe("ErrorMapping.map", () => {
  it.each([
    [new InputParseError("Datos inválidos."), 400],
    [new UnauthorizedError(), 401],
    [new ForbiddenError(), 403],
    [new NotFoundError(), 404],
    [new ConflictError(), 409],
    [new UnprocessableError("No aplica."), 422],
  ])("maps %p to %i and keeps its message", (error, status) => {
    const mapped = ErrorMapping.map(error, FALLBACK);

    expect(mapped).toMatchObject({ status, message: error.message, expected: true });
  });

  it("keeps field errors from input errors", () => {
    const mapped = ErrorMapping.map(new InputParseError("Datos inválidos.", { email: "Correo inválido" }), FALLBACK);

    expect(mapped.fieldErrors).toEqual({ email: "Correo inválido" });
  });

  it("drops an empty field error map", () => {
    const mapped = ErrorMapping.map(new InputParseError("Datos inválidos.", {}), FALLBACK);

    expect(mapped.fieldErrors).toBeUndefined();
  });

  it("uses the status of an HttpError", () => {
    const mapped = ErrorMapping.map(new HttpError("Tipo de contenido no soportado.", 415), FALLBACK);

    expect(mapped).toMatchObject({ status: 415, message: "Tipo de contenido no soportado.", expected: true });
  });

  it("hides unexpected errors behind the fallback message", () => {
    const mapped = ErrorMapping.map(new Error("connection refused at 10.0.0.1"), FALLBACK);

    expect(mapped).toEqual({ status: 500, message: FALLBACK, expected: false });
  });
});
