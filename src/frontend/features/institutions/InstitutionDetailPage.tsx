"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import type { UpdateInstitutionBody } from "@/domains/institutions/validations/institution.validation";
import type { InstitutionDto } from "@/domains/institutions/views/institution.view";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { InstitutionStatusBadge, isArchived } from "@/frontend/components/admin/statusLabels";
import { useResource } from "@/frontend/hooks/useResource";
import { ConfirmActionButton } from "@/frontend/components/shared/ConfirmActionButton";
import { formatDate } from "@/lib/date";
import { LoadingState } from "@/frontend/components/shared/LoadingState";
import { Alert } from "@/frontend/components/ui/Alert";
import { Button } from "@/frontend/components/ui/Button";
import { Card } from "@/frontend/components/ui/Card";
import { DescriptionList } from "@/frontend/components/ui/DescriptionList";
import { InstitutionForm } from "./InstitutionForm";
import { InstitutionStudentsSection } from "./InstitutionStudentsSection";

function InstitutionDetails({ institution }: { institution: InstitutionDto }) {
  return (
    <DescriptionList
      items={[
        { term: "Slug", detail: institution.slug },
        { term: "Correo de contacto", detail: institution.contactEmail },
        { term: "Creada", detail: formatDate(institution.createdAt) },
        { term: "Archivada", detail: institution.archivedAt ? formatDate(institution.archivedAt) : "—" },
      ]}
    />
  );
}

export function InstitutionDetailPage({ institutionId }: { institutionId: string }) {
  const load = useCallback(() => AdminInstitutions.get(institutionId), [institutionId]);
  const resource = useResource(load);
  const update = useCallback(
    (values: UpdateInstitutionBody) => AdminInstitutions.update(institutionId, values),
    [institutionId],
  );
  const archive = useCallback(() => AdminInstitutions.archive(institutionId), [institutionId]);
  const [isEditing, setIsEditing] = useState(false);
  const institution = resource.data;

  if (resource.error) {
    return (
      <Alert
        action={
          <Button variant="secondary" onClick={resource.reload}>
            Reintentar
          </Button>
        }
      >
        {resource.error}
      </Alert>
    );
  }
  if (!institution) return <LoadingState />;

  const readOnly = isArchived(institution);

  return (
    <>
      <div>
        <Link href={AdminRoutes.institutions} className="text-sm text-teal-800 hover:underline">
          ← Instituciones
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{institution.name}</h1>
          <InstitutionStatusBadge status={institution.status} />
        </div>
      </div>

      {readOnly && <Alert tone="info">Esta institución está archivada. Solo puedes consultar su información.</Alert>}

      <Card
        title="Información"
        actions={
          !readOnly &&
          !isEditing && (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
              <ConfirmActionButton
                label="Archivar"
                title={`¿Archivar ${institution.name}?`}
                description="La institución quedará en modo solo lectura. Sus estudiantes se conservan."
                action={archive}
                onDone={resource.replace}
              />
            </>
          )
        }
      >
        {isEditing ? (
          <InstitutionForm
            initialValues={{ name: institution.name, slug: institution.slug, contactEmail: institution.contactEmail }}
            submitLabel="Guardar cambios"
            submit={update}
            onSuccess={(updated) => {
              resource.replace(updated);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <InstitutionDetails institution={institution} />
        )}
      </Card>

      <InstitutionStudentsSection institutionId={institution.id} readOnly={readOnly} />
    </>
  );
}
