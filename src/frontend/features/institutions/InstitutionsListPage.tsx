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
import { Table, type TableColumn } from "@/frontend/components/shared/Table";
import { ListFilters } from "@/frontend/components/shared/ListFilters";
import { ListShell } from "@/frontend/components/shared/ListShell";
import { type FilterField, recordToOptions } from "@/frontend/components/shared/listTypes";
import { Pagination } from "@/frontend/components/shared/Pagination";
import { formatDate } from "@/lib/date";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { PlusIcon } from "@/frontend/icons/PlusIcon";
import { InstitutionFormModal } from "./InstitutionFormModal";

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

  const openInstitution = (institution: { id: string }) => {
    router.push(AdminRoutes.institution(institution.id));
  };

  return (
    <>
      <InstitutionFormModal
        open={isCreating}
        title="New institution"
        submitLabel="Create institution"
        submit={AdminInstitutions.create}
        onSuccess={openInstitution}
        onClose={() => setIsCreating(false)}
      />

      <Card
        title="Institutions"
        actions={
          <Button size="sm" icon={<PlusIcon />} onClick={() => setIsCreating(true)} aria-label="New institution" />
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
          emptyMessage="No institutions match the filters."
        >
          <Table columns={COLUMNS} rows={list.data} rowKey={(row) => row.id} onRowClick={openInstitution} />
        </ListShell>
      </Card>
    </>
  );
}
