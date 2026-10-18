import { ConflictError, NotFoundError } from "@/lib/errors/domain.errors";

export const STUDENT_ERROR_MESSAGES = {
  notFound: "We couldn't find the student.",
  emailTaken: "A student with that email already exists.",
  alreadyInactive: "The student is already inactive.",
} as const;

export const StudentErrors = {
  notFound: () => new NotFoundError(STUDENT_ERROR_MESSAGES.notFound),
  emailTaken: () => new ConflictError(STUDENT_ERROR_MESSAGES.emailTaken),
  alreadyInactive: () => new ConflictError(STUDENT_ERROR_MESSAGES.alreadyInactive),
};
