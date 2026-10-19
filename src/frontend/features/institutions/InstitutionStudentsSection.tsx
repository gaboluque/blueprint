"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import {
  listStudentsQuerySchema,
  type CreateStudentBody,
  type ListStudentsQuery,
} from "@/domains/students/validations/student.validation";
import type { StudentDto } from "@/domains/students/views/student.view";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { STUDENT_STATUS_LABELS, StudentStatusBadge } from "@/frontend/components/admin/statusLabels";
import { StudentFormModal } from "@/frontend/features/students/StudentFormModal";
import { useListQuery } from "@/frontend/hooks/useListQuery";
import { Table, type TableColumn } from "@/frontend/components/shared/Table";
import { ListFilters } from "@/frontend/components/shared/ListFilters";
import { ListShell } from "@/frontend/components/shared/ListShell";
import { recordToOptions, type FilterField } from "@/frontend/components/shared/listTypes";
import { Pagination } from "@/frontend/components/shared/Pagination";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon } from "@/frontend/icons/PlusIcon";

const INITIAL_QUERY: ListStudentsQuery = { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: undefined };

const FILTER_FIELDS: FilterField<ListStudentsQuery>[] = [
  { type: "search", name: "search", label: "Search by name, email, or ID document" },
  {
    type: "select",
    name: "status",
    label: "Status",
    allLabel: "All",
    options: recordToOptions(STUDENT_STATUS_LABELS),
  },
];

const COLUMNS: TableColumn<StudentDto>[] = [
  {
    key: "fullName",
    header: "Name",
    cell: (student) => student.fullName,
  },
  { key: "email", header: "Email", cell: (student) => student.email },
  { key: "documentId", header: "Document ID", cell: (student) => student.documentId },
  { key: "status", header: "Status", cell: (student) => <StudentStatusBadge status={student.status} /> },
];

type InstitutionStudentsSectionProps = {
  institutionId: string;
  readOnly: boolean;
};

export function InstitutionStudentsSection({ institutionId, readOnly }: InstitutionStudentsSectionProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const fetch = useCallback(
    (query: ListStudentsQuery) => AdminInstitutions.listStudents(institutionId, query),
    [institutionId],
  );
  const createStudent = useCallback(
    (body: CreateStudentBody) => AdminInstitutions.createStudent(institutionId, body),
    [institutionId],
  );
  const list = useListQuery({
    initialQuery: INITIAL_QUERY,
    fetch,
    querySchema: listStudentsQuerySchema,
  });

  const openStudent = (student: { id: string }) => {
    router.push(AdminRoutes.student(student.id));
  };

  const finishAddStudent = () => {
    setIsAdding(false);
    list.refetch();
  };

  return (
    <>
      {!readOnly && (
        <StudentFormModal
          open={isAdding}
          title="New student"
          submitLabel="Add student"
          submit={createStudent}
          onSuccess={finishAddStudent}
          onClose={() => setIsAdding(false)}
          idPrefix="institution-student"
        />
      )}

      <Card
        title="Students"
        actions={
          !readOnly &&
          !isAdding && (
            <Button size="sm" icon={<PlusIcon />} onClick={() => setIsAdding(true)} aria-label="Add student" />
          )
        }
        footer={<Pagination {...list.pagination} onPageChange={(page) => list.patchQuery({ page })} />}
      >
        <ListFilters fields={FILTER_FIELDS} query={list.query} onChange={list.patchQuery} />
        <ListShell
          isLoading={list.isLoading}
          hasLoadedOnce={list.hasLoadedOnce}
          error={list.error}
          onRetry={list.refetch}
          isEmpty={list.data.length === 0}
          emptyMessage="No students match the filters."
        >
          <Table columns={COLUMNS} rows={list.data} rowKey={(row) => row.id} onRowClick={openStudent} />
        </ListShell>
      </Card>
    </>
  );
}
