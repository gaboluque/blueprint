import type { FieldErrors } from "./domain.errors";

/** HTTP-only failures (e.g. unsupported media type). Services throw `DomainError`, never this. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
