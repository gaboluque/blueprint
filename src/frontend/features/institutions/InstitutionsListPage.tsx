"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import type { ListInstitutionsQuery } from "@/domains/institutions/validations/institution.validation";
import type { InstitutionListItemDto } from "@/domains/institutions/views/institution.view";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { INSTITUTION_STATUS_LABELS, InstitutionStatusBadge } from "@/frontend/components/admin/statusLabels";
import { useListQuery } from "@/frontend/hooks/useListQuery";
import { DataTable, type DataTableColumn } from "@/frontend/components/shared/DataTable";
import { ListFilters } from "@/frontend/components/shared/ListFilters";
import { ListShell } from "@/frontend/components/shared/ListShell";
import { recordToOptions, type FilterField } from "@/frontend/components/shared/listTypes";
import { Pagination } from "@/frontend/components/shared/Pagination";
import { formatDate } from "@/lib/date";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { InstitutionForm } from "./InstitutionForm";

const INITIAL_QUERY: ListInstitutionsQuery = { page: 1, pageSize: DEFAULT_PAGE_SIZE, search: undefined };

const FILTER_FIELDS: FilterField<ListInstitutionsQuery>[] = [
  { type: "search", name: "search", label: "Buscar por nombre o slug" },
  { type: "select", name: "status", label: "Estado", allLabel: "Todas", options: recordToOptions(INSTITUTION_STATUS_LABELS) },
];

const COLUMNS: DataTableColumn<InstitutionListItemDto>[] = [
  {
    key: "name",
    header: "Nombre",
    cell: (institution) => (
      <Link href={AdminRoutes.institution(institution.id)} className="font-medium text-teal-800 hover:underline">
        {institution.name}
      </Link>
    ),
  },
  { key: "slug", header: "Slug", cell: (institution) => institution.slug },
  { key: "contactEmail", header: "Correo de contacto", cell: (institution) => institution.contactEmail },
  { key: "studentCount", header: "Estudiantes", align: "right", cell: (institution) => institution.studentCount },
  { key: "status", header: "Estado", cell: (institution) => <InstitutionStatusBadge status={institution.status} /> },
  { key: "createdAt", header: "Creada", cell: (institution) => formatDate(institution.createdAt) },
];

export function InstitutionsListPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const list = useListQuery({ initialQuery: INITIAL_QUERY, fetch: AdminInstitutions.list });

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Instituciones</h1>

      {isCreating && (
        <Card title="Nueva institución">
          <InstitutionForm
            submitLabel="Crear institución"
            submit={AdminInstitutions.create}
            onSuccess={(institution) => router.push(AdminRoutes.institution(institution.id))}
            onCancel={() => setIsCreating(false)}
          />
        </Card>
      )}

      <Card
        title="Listado"
        actions={!isCreating && <Button onClick={() => setIsCreating(true)}>Nueva institución</Button>}
      >
        <ListFilters fields={FILTER_FIELDS} query={list.query} onChange={list.patchQuery} />
        <ListShell
          isLoading={list.isLoading}
          hasLoadedOnce={list.hasLoadedOnce}
          error={list.error}
          onRetry={list.refetch}
          isEmpty={list.data.length === 0}
          emptyMessage="No hay instituciones que coincidan con los filtros."
        >
          <DataTable caption="Instituciones" columns={COLUMNS} rows={list.data} rowKey={(row) => row.id} />
          <Pagination {...list.pagination} onPageChange={(page) => list.patchQuery({ page })} />
        </ListShell>
      </Card>
    </>
  );
}
