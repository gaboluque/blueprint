import { ConflictError, NotFoundError } from "@/lib/errors/domain.errors";

export const INSTITUTION_ERROR_MESSAGES = {
  notFound: "No encontramos la institución.",
  archived: "La institución está archivada y no se puede modificar.",
  alreadyArchived: "La institución ya está archivada.",
  slugTaken: "Ya existe una institución con ese identificador (slug).",
} as const;

export const InstitutionErrors = {
  notFound: () => new NotFoundError(INSTITUTION_ERROR_MESSAGES.notFound),
  archived: () => new ConflictError(INSTITUTION_ERROR_MESSAGES.archived),
  alreadyArchived: () => new ConflictError(INSTITUTION_ERROR_MESSAGES.alreadyArchived),
};
