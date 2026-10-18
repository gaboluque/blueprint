import { ConflictError, NotFoundError } from "@/lib/errors/domain.errors";

export const INSTITUTION_ERROR_MESSAGES = {
  notFound: "We couldn't find the institution.",
  archived: "The institution is archived and can't be modified.",
  alreadyArchived: "The institution is already archived.",
  slugTaken: "An institution with that slug already exists.",
} as const;

export const InstitutionErrors = {
  notFound: () => new NotFoundError(INSTITUTION_ERROR_MESSAGES.notFound),
  archived: () => new ConflictError(INSTITUTION_ERROR_MESSAGES.archived),
  alreadyArchived: () => new ConflictError(INSTITUTION_ERROR_MESSAGES.alreadyArchived),
  slugTaken: () => new ConflictError(INSTITUTION_ERROR_MESSAGES.slugTaken),
};
