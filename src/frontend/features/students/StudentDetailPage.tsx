"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import { AdminStudents } from "@/frontend/gateway/students";
import type { InstitutionDto } from "@/domains/institutions/views/institution.view";
import type { UpdateStudentBody } from "@/domains/students/validations/student.validation";
import type { StudentDto } from "@/domains/students/views/student.view";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { isActiveStudent, isArchived, StudentStatusBadge } from "@/frontend/components/admin/statusLabels";
import { useResource } from "@/frontend/hooks/useResource";
import { ConfirmActionButton } from "@/frontend/components/shared/ConfirmActionButton";
import { formatDate } from "@/lib/date";
import { LoadingState } from "@/frontend/components/shared/LoadingState";
import { Alert } from "@/frontend/components/ui/Alert";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { DescriptionList } from "@/frontend/components/ui/DescriptionList";
import { EditIcon } from "@/frontend/icons/EditIcon";
import { TrashIcon } from "@/frontend/icons/TrashIcon";
import { StudentFormModal } from "./StudentFormModal";

type StudentWithInstitution = { student: StudentDto; institution: InstitutionDto };

async function loadStudentWithInstitution(studentId: string): Promise<ApiResult<StudentWithInstitution>> {
  const student = await AdminStudents.get(studentId);
  if (!student.ok) return student;
  const institution = await AdminInstitutions.get(student.data.institutionId);
  if (!institution.ok) return institution;
  return { ok: true, data: { student: student.data, institution: institution.data } };
}

function StudentDetails({ student, institution }: StudentWithInstitution) {
  return (
    <DescriptionList
      items={[
        {
          term: "Institution",
          detail: (
            <Link href={AdminRoutes.institution(institution.id)} className="text-sky-800 hover:underline">
              {institution.name}
            </Link>
          ),
        },
        { term: "Status", detail: <StudentStatusBadge status={student.status} /> },
        { term: "Email", detail: student.email },
        { term: "Document ID", detail: student.documentId },
        { term: "Registered", detail: formatDate(student.createdAt) },
      ]}
    />
  );
}

export function StudentDetailPage({ studentId }: { studentId: string }) {
  const load = useCallback(() => loadStudentWithInstitution(studentId), [studentId]);
  const resource = useResource(load);
  const update = useCallback((body: UpdateStudentBody) => AdminStudents.update(studentId, body), [studentId]);
  const deactivate = useCallback(() => AdminStudents.deactivate(studentId), [studentId]);
  const [isEditing, setIsEditing] = useState(false);
  const replaceStudent = useCallback(
    (updated: StudentDto) => {
      const bundle = resource.data;
      if (!bundle) return;
      resource.replace({ student: updated, institution: bundle.institution });
    },
    [resource],
  );
  const saveStudent = useCallback(
    (updated: StudentDto) => {
      replaceStudent(updated);
      setIsEditing(false);
    },
    [replaceStudent],
  );
  const bundle = resource.data;

  if (resource.error) {
    return (
      <Alert
        action={
          <Button variant="secondary" onClick={resource.reload}>
            Retry
          </Button>
        }
      >
        {resource.error}
      </Alert>
    );
  }
  if (!bundle) return <LoadingState />;

  const { student, institution } = bundle;
  const readOnly = isArchived(institution);

  return (
    <>
      {readOnly && (
        <Alert tone="info">This student&apos;s institution is archived. You can only view their information.</Alert>
      )}
      <Card
        title={student.fullName}
        actions={
          !readOnly && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                aria-label="Edit"
              />
              {isActiveStudent(student) && (
                <ConfirmActionButton
                  label="Deactivate"
                  title={`Deactivate ${student.fullName}?`}
                  description="The student becomes inactive. Their data is kept and you can reactivate them by editing their status."
                  action={deactivate}
                  onDone={replaceStudent}
                  icon={<TrashIcon />}
                />
              )}
            </>
          )
        }
      >
        <StudentDetails student={student} institution={institution} />
      </Card>

      <StudentFormModal
        open={isEditing}
        title="Edit student"
        submitLabel="Save changes"
        initialValues={{
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          documentId: student.documentId,
          status: student.status,
        }}
        submit={update}
        onSuccess={saveStudent}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
