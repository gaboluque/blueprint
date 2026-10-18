"use client";

import Link from "next/link";
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
import { StudentForm } from "@/frontend/features/students/StudentForm";
import { useListQuery } from "@/frontend/hooks/useListQuery";
import { DataTable, type DataTableColumn } from "@/frontend/components/shared/DataTable";
import { ListFilters } from "@/frontend/components/shared/ListFilters";
import { ListShell } from "@/frontend/components/shared/ListShell";
import { recordToOptions, type FilterField } from "@/frontend/components/shared/listTypes";
import { Pagination } from "@/frontend/components/shared/Pagination";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

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

const COLUMNS: DataTableColumn<StudentDto>[] = [
  {
    key: "fullName",
    header: "Name",
    cell: (student) => (
      <Link href={AdminRoutes.student(student.id)} className="font-medium text-teal-800 hover:underline">
        {student.fullName}
      </Link>
    ),
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
  const [isAdding, setIsAdding] = useState(false);
  const fetch = useCallback(
    (query: ListStudentsQuery) => AdminInstitutions.listStudents(institutionId, query),
    [institutionId],
  );
  const create = useCallback(
    (body: CreateStudentBody) => AdminInstitutions.createStudent(institutionId, body),
    [institutionId],
  );
  const list = useListQuery({
    initialQuery: INITIAL_QUERY,
    fetch,
    querySchema: listStudentsQuerySchema,
  });

  return (
    <Card
      title="Students"
      actions={!readOnly && !isAdding && <Button onClick={() => setIsAdding(true)}>Add student</Button>}
    >
      {isAdding && !readOnly && (
        <div className="mb-6 rounded-md border border-slate-200 p-4">
          <h3 className="mb-3 font-medium text-slate-900">New student</h3>
          <StudentForm
            submitLabel="Add student"
            submit={create}
            onSuccess={() => {
              setIsAdding(false);
              list.refetch();
            }}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}
      <ListFilters fields={FILTER_FIELDS} query={list.query} onChange={list.patchQuery} />
      <ListShell
        isLoading={list.isLoading}
        hasLoadedOnce={list.hasLoadedOnce}
        error={list.error}
        onRetry={list.refetch}
        isEmpty={list.data.length === 0}
        emptyMessage="No students match the filters."
      >
        <DataTable caption="Students at this institution" columns={COLUMNS} rows={list.data} rowKey={(row) => row.id} />
        <Pagination {...list.pagination} onPageChange={(page) => list.patchQuery({ page })} />
      </ListShell>
    </Card>
  );
}
