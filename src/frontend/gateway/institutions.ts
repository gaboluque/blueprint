import type {
  CreateInstitutionBody,
  ListInstitutionsQuery,
  UpdateInstitutionBody,
} from "@/domains/institutions/validations/institution.validation";
import type { InstitutionDto, InstitutionListItemDto } from "@/domains/institutions/views/institution.view";
import type { CreateStudentBody, ListStudentsQuery } from "@/domains/students/validations/student.validation";
import type { StudentDto } from "@/domains/students/views/student.view";
import { ApiClient } from "./apiClient";

const INSTITUTIONS_PATH = "/api/admin/institutions";

const institutionPath = (id: string) => `${INSTITUTIONS_PATH}/${encodeURIComponent(id)}`;
const studentsPath = (institutionId: string) => `${institutionPath(institutionId)}/students`;

export const AdminInstitutions = {
  list: (query: ListInstitutionsQuery) => ApiClient.get<InstitutionListItemDto[]>(INSTITUTIONS_PATH, query),
  create: (body: CreateInstitutionBody) => ApiClient.post<InstitutionDto>(INSTITUTIONS_PATH, body),
  get: (id: string) => ApiClient.get<InstitutionDto>(institutionPath(id)),
  update: (id: string, body: UpdateInstitutionBody) => ApiClient.patch<InstitutionDto>(institutionPath(id), body),
  archive: (id: string) => ApiClient.delete<InstitutionDto>(institutionPath(id)),
  listStudents: (institutionId: string, query: ListStudentsQuery) =>
    ApiClient.get<StudentDto[]>(studentsPath(institutionId), query),
  createStudent: (institutionId: string, body: CreateStudentBody) =>
    ApiClient.post<StudentDto>(studentsPath(institutionId), body),
};
