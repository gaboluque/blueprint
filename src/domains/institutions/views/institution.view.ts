import type { InstitutionStatus } from "@/lib/db/schema";
import type { InstitutionWithStudentCount } from "../institutions.repo";
import type { Institution } from "../institution.model";

/** Wire contract. Dates are ISO 8601 strings. */
export type InstitutionDto = {
  id: string;
  name: string;
  contactEmail: string;
  status: InstitutionStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InstitutionListItemDto = InstitutionDto & {
  studentCount: number;
};

function format(institution: Institution): InstitutionDto {
  return {
    id: institution.id,
    name: institution.name,
    contactEmail: institution.contactEmail,
    status: institution.status,
    archivedAt: institution.archivedAt?.toISOString() ?? null,
    createdAt: institution.createdAt.toISOString(),
    updatedAt: institution.updatedAt.toISOString(),
  };
}

function formatListItem({ institution, studentCount }: InstitutionWithStudentCount): InstitutionListItemDto {
  return { ...format(institution), studentCount };
}

export const InstitutionView = { format, formatListItem };
