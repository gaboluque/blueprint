"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import {
  type ListInstitutionsQuery,
  listInstitutionsQuerySchema,
} from "@/domains/institutions/validations/institution.validation";
import type { InstitutionListItemDto } from "@/domains/institutions/views/institution.view";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { INSTITUTION_STATUS_LABELS, InstitutionStatusBadge } from "@/frontend/components/admin/statusLabels";
import { useListQuery } from "@/frontend/hooks/useListQuery";
import { type TableColumn, Table } from "@/frontend/components/shared/Table";
import { ListFilters } from "@/frontend/components/shared/ListFilters";
import { ListShell } from "@/frontend/components/shared/ListShell";
import { type FilterField, recordToOptions } from "@/frontend/components/shared/listTypes";
import { Pagination } from "@/frontend/components/shared/Pagination";
import { formatDate } from "@/lib/date";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { InstitutionForm } from "./InstitutionForm";

const INITIAL_QUERY: ListInstitutionsQuery = { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: undefined };

const FILTER_FIELDS: FilterField<ListInstitutionsQuery>[] = [
  { type: "search", name: "search", label: "Search by name" },
  {
    type: "select",
    name: "status",
    label: "Status",
    allLabel: "All",
    options: recordToOptions(INSTITUTION_STATUS_LABELS),
  },
];

const COLUMNS: TableColumn<InstitutionListItemDto>[] = [
  {
    key: "name",
    header: "Name",
    cell: (institution) => institution.name,
  },
  { key: "contactEmail", header: "Contact email", cell: (institution) => institution.contactEmail },
  { key: "studentCount", header: "Students", align: "right", cell: (institution) => institution.studentCount },
  { key: "status", header: "Status", cell: (institution) => <InstitutionStatusBadge status={institution.status} /> },
  { key: "createdAt", header: "Created", cell: (institution) => formatDate(institution.createdAt) },
];

export function InstitutionsListPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const list = useListQuery({
    initialQuery: INITIAL_QUERY,
    fetch: AdminInstitutions.list,
    querySchema: listInstitutionsQuerySchema,
  });

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Institutions</h1>

      {isCreating && (
        <Card title="New institution">
          <InstitutionForm
            submitLabel="Create institution"
            submit={AdminInstitutions.create}
            onSuccess={(institution) => router.push(AdminRoutes.institution(institution.id))}
            onCancel={() => setIsCreating(false)}
          />
        </Card>
      )}

      <Card title="List" actions={!isCreating && <Button onClick={() => setIsCreating(true)}>New institution</Button>}>
        <ListFilters fields={FILTER_FIELDS} query={list.query} onChange={list.patchQuery} />
        <ListShell
          isLoading={list.isLoading}
          hasLoadedOnce={list.hasLoadedOnce}
          error={list.error}
          onRetry={list.refetch}
          isEmpty={list.data.length === 0}
          emptyMessage="No institutions match the filters."
        >
          <Table
            columns={COLUMNS}
            rows={list.data}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(AdminRoutes.institution(row.id))}
          />
          <Pagination {...list.pagination} onPageChange={(page) => list.patchQuery({ page })} />
        </ListShell>
      </Card>
    </>
  );
}
