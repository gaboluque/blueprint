import type { StudentStatus } from "@/lib/db/schema";
import type { Student } from "../student.model";

/** Wire contract. Dates are ISO 8601 strings. */
export type StudentDto = {
  id: string;
  institutionId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  documentId: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
};

function format(student: Student): StudentDto {
  return {
    id: student.id,
    institutionId: student.institutionId,
    firstName: student.firstName,
    lastName: student.lastName,
    fullName: student.fullName(),
    email: student.email,
    documentId: student.documentId,
    status: student.status,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}

export const StudentView = { format };
