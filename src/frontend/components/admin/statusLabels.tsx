import type { InstitutionDto } from "@/domains/institutions/views/institution.view";
import type { StudentDto } from "@/domains/students/views/student.view";
import { Badge, type BadgeTone } from "@/frontend/components/ui/Badge";

export type InstitutionStatus = InstitutionDto["status"];
export type StudentStatus = StudentDto["status"];

export const INSTITUTION_STATUS_LABELS: Record<InstitutionStatus, string> = {
  active: "Activa",
  archived: "Archivada",
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

const INSTITUTION_STATUS_TONES: Record<InstitutionStatus, BadgeTone> = { active: "success", archived: "neutral" };
const STUDENT_STATUS_TONES: Record<StudentStatus, BadgeTone> = { active: "success", inactive: "neutral" };

export const DEFAULT_STUDENT_STATUS: StudentStatus = "active";

/** Display-only; the API rejects writes on archived institutions with `409`. */
export function isArchived(institution: Pick<InstitutionDto, "status">): boolean {
  return institution.status === "archived";
}

export function isActiveStudent(student: Pick<StudentDto, "status">): boolean {
  return student.status === "active";
}

export function InstitutionStatusBadge({ status }: { status: InstitutionStatus }) {
  return <Badge tone={INSTITUTION_STATUS_TONES[status]}>{INSTITUTION_STATUS_LABELS[status]}</Badge>;
}

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return <Badge tone={STUDENT_STATUS_TONES[status]}>{STUDENT_STATUS_LABELS[status]}</Badge>;
}
