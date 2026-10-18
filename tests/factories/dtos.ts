import type { InstitutionDto, InstitutionListItemDto } from "@/domains/institutions/views/institution.view";
import type { StudentDto } from "@/domains/students/views/student.view";

const TIMESTAMP = "2026-01-15T15:00:00.000Z";

export function institutionDto(overrides: Partial<InstitutionDto> = {}): InstitutionDto {
  return {
    id: "6f1c2c7e-6b1a-4c55-9a0e-3d0f7d6b2a11",
    name: "Universidad Ficticia del Norte",
    contactEmail: "contacto@ficticia.test",
    status: "active",
    archivedAt: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export function institutionListItemDto(overrides: Partial<InstitutionListItemDto> = {}): InstitutionListItemDto {
  return { ...institutionDto(), studentCount: 0, ...overrides };
}

export function studentDto(overrides: Partial<StudentDto> = {}): StudentDto {
  return {
    id: "0b5c9a8e-2f43-4d7e-8f61-7a2b4c9d1e22",
    institutionId: institutionDto().id,
    firstName: "Ana",
    lastName: "Prueba",
    fullName: "Ana Prueba",
    email: "ana.prueba@ficticia.test",
    documentId: "1000000001",
    status: "active",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}
