import { ConflictError, NotFoundError } from "@/lib/errors/domain.errors";

export const INSTITUTION_ERROR_MESSAGES = {
  notFound: "We couldn't find the institution.",
  archived: "The institution is archived and can't be modified.",
  alreadyArchived: "The institution is already archived.",
} as const;

export const InstitutionErrors = {
  notFound: () => new NotFoundError(INSTITUTION_ERROR_MESSAGES.notFound),
  archived: () => new ConflictError(INSTITUTION_ERROR_MESSAGES.archived),
  alreadyArchived: () => new ConflictError(INSTITUTION_ERROR_MESSAGES.alreadyArchived),
};
