export type FieldErrors = Record<string, string>;

export type DomainErrorKind =
  | "input"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable";

/** Expected failure raised by services, models, policies, and repos. Messages are user-safe Spanish. */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
}

export class InputParseError extends DomainError {
  readonly kind = "input";

  constructor(
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "InputParseError";
  }
}

export class UnauthorizedError extends DomainError {
  readonly kind = "unauthorized";

  constructor(message = "Debes iniciar sesión.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  readonly kind = "forbidden";

  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DomainError {
  readonly kind = "not_found";

  constructor(message = "No encontramos el recurso solicitado.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  readonly kind = "conflict";

  constructor(message = "Conflicto de datos.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class UnprocessableError extends DomainError {
  readonly kind = "unprocessable";

  constructor(message: string) {
    super(message);
    this.name = "UnprocessableError";
  }
}
