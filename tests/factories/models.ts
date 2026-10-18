import { Institution, type InstitutionProps } from "@/domains/institutions/institution.model";
import { Student, type StudentProps } from "@/domains/students/student.model";
import { User, type UserProps } from "@/domains/users/user.model";
import type { Actor } from "@/lib/auth/actor";

const CREATED_AT = new Date("2026-01-15T10:00:00.000Z");

export const INSTITUTION_ID = "11111111-1111-4111-8111-111111111111";
export const STUDENT_ID = "22222222-2222-4222-8222-222222222222";
export const USER_ID = "33333333-3333-4333-8333-333333333333";
export const STAFF_USER_ID = "44444444-4444-4444-8444-444444444444";

export function buildInstitution(overrides: Partial<InstitutionProps> = {}): Institution {
  return new Institution({
    id: INSTITUTION_ID,
    name: "Universidad Ficticia",
    contactEmail: "bienestar@ficticia.test",
    status: "active",
    archivedAt: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  });
}

export function buildArchivedInstitution(overrides: Partial<InstitutionProps> = {}): Institution {
  return buildInstitution({ status: "archived", archivedAt: new Date("2026-02-01T00:00:00.000Z"), ...overrides });
}

export function buildStudent(overrides: Partial<StudentProps> = {}): Student {
  return new Student({
    id: STUDENT_ID,
    institutionId: INSTITUTION_ID,
    firstName: "Ana",
    lastName: "Prueba",
    email: "ana.prueba@ficticia.test",
    documentId: "1000000001",
    status: "active",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  });
}

export function buildUser(overrides: Partial<UserProps> = {}): User {
  return new User({
    id: USER_ID,
    email: "admin@blueprint.test",
    name: "Admin Prueba",
    role: "admin",
    passwordHash: "not-a-real-hash",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  });
}

export function buildAdminActor(): Actor {
  return buildUser().toActor();
}

export function buildInstitutionStaffUser(overrides: Partial<UserProps> = {}): User {
  return buildUser({
    id: STAFF_USER_ID,
    email: "staff@ficticia.test",
    name: "Staff Prueba",
    role: "institution_staff",
    ...overrides,
  });
}

export function buildInstitutionStaffActor(
  overrides: Partial<Actor> = {},
  membership: { institutionId?: string; institutionRole?: "admin" | "teacher" } = {},
): Actor {
  return {
    ...buildInstitutionStaffUser().toActor({
      institutionId: membership.institutionId ?? INSTITUTION_ID,
      institutionRole: membership.institutionRole ?? "admin",
    }),
    ...overrides,
  };
}
