import { DomainError, type DomainErrorKind, type FieldErrors } from "./domain.errors";
import { HttpError } from "./http.errors";

export type MappedError = {
  status: number;
  message: string;
  fieldErrors?: FieldErrors;
  expected: boolean;
};

function statusFor(kind: DomainErrorKind): number {
  switch (kind) {
    case "input":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "unprocessable":
      return 422;
    default: {
      const unreachable: never = kind;
      throw new Error(`Unhandled domain error kind: ${String(unreachable)}`);
    }
  }
}

function fieldErrorsOf(error: DomainError | HttpError): FieldErrors | undefined {
  if (!("fieldErrors" in error) || !error.fieldErrors) return undefined;
  return Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined;
}

/** Expected errors keep their message; anything else becomes the route's fallback (and gets logged). */
function map(error: unknown, fallbackError: string): MappedError {
  if (error instanceof DomainError) {
    return {
      status: statusFor(error.kind),
      message: error.message,
      fieldErrors: fieldErrorsOf(error),
      expected: true,
    };
  }
  if (error instanceof HttpError) {
    return {
      status: error.status,
      message: error.message,
      fieldErrors: fieldErrorsOf(error),
      expected: true,
    };
  }
  return { status: 500, message: fallbackError, expected: false };
}

export const ErrorMapping = { map, statusFor };
