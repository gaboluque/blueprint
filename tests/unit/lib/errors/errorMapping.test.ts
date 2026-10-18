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

const FALLBACK = "We couldn't complete the request.";

describe("ErrorMapping.map", () => {
  it.each([
    [new InputParseError("Invalid data."), 400],
    [new UnauthorizedError(), 401],
    [new ForbiddenError(), 403],
    [new NotFoundError(), 404],
    [new ConflictError(), 409],
    [new UnprocessableError("Not applicable."), 422],
  ])("maps %p to %i and keeps its message", (error, status) => {
    const mapped = ErrorMapping.map(error, FALLBACK);

    expect(mapped).toMatchObject({ status, message: error.message, expected: true });
  });

  it("keeps field errors from input errors", () => {
    const mapped = ErrorMapping.map(new InputParseError("Invalid data.", { email: "Invalid email" }), FALLBACK);

    expect(mapped.fieldErrors).toEqual({ email: "Invalid email" });
  });

  it("drops an empty field error map", () => {
    const mapped = ErrorMapping.map(new InputParseError("Invalid data.", {}), FALLBACK);

    expect(mapped.fieldErrors).toBeUndefined();
  });

  it("uses the status of an HttpError", () => {
    const mapped = ErrorMapping.map(new HttpError("Unsupported media type.", 415), FALLBACK);

    expect(mapped).toMatchObject({ status: 415, message: "Unsupported media type.", expected: true });
  });

  it("hides unexpected errors behind the fallback message", () => {
    const mapped = ErrorMapping.map(new Error("connection refused at 10.0.0.1"), FALLBACK);

    expect(mapped).toEqual({ status: 500, message: FALLBACK, expected: false });
  });
});
