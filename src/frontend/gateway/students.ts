import type { UpdateStudentBody } from "@/domains/students/validations/student.validation";
import type { StudentDto } from "@/domains/students/views/student.view";
import { ApiClient } from "./apiClient";

const studentPath = (id: string) => `/api/admin/students/${encodeURIComponent(id)}`;

export const AdminStudents = {
  get: (id: string) => ApiClient.get<StudentDto>(studentPath(id)),
  update: (id: string, body: UpdateStudentBody) => ApiClient.patch<StudentDto>(studentPath(id), body),
  /** `DELETE` deactivates the student; the row is kept. */
  deactivate: (id: string) => ApiClient.delete<StudentDto>(studentPath(id)),
};
