import { ConflictError, NotFoundError } from "@/lib/errors/domain.errors";

export const STUDENT_ERROR_MESSAGES = {
  notFound: "No encontramos el estudiante.",
  emailTaken: "Ya existe un estudiante con ese correo.",
  alreadyInactive: "El estudiante ya está inactivo.",
} as const;

export const StudentErrors = {
  notFound: () => new NotFoundError(STUDENT_ERROR_MESSAGES.notFound),
  emailTaken: () => new ConflictError(STUDENT_ERROR_MESSAGES.emailTaken),
  alreadyInactive: () => new ConflictError(STUDENT_ERROR_MESSAGES.alreadyInactive),
};
