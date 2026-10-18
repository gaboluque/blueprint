"use client";

import { useCallback, useState } from "react";
import { AdminInstitutions } from "@/frontend/gateway/institutions";
import type { UpdateInstitutionBody } from "@/domains/institutions/validations/institution.validation";
import type { InstitutionDto } from "@/domains/institutions/views/institution.view";
import { isArchived } from "@/frontend/components/admin/statusLabels";
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
import { InstitutionFormModal } from "./InstitutionFormModal";
import { InstitutionStudentsSection } from "./InstitutionStudentsSection";

function InstitutionDetails({ institution }: { institution: InstitutionDto }) {
  return (
    <DescriptionList
      items={[
        { term: "Contact email", detail: institution.contactEmail },
        { term: "Created", detail: formatDate(institution.createdAt) },
        { term: "Archived", detail: institution.archivedAt ? formatDate(institution.archivedAt) : "—" },
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
  const saveInstitution = useCallback(
    (updated: InstitutionDto) => {
      resource.replace(updated);
      setIsEditing(false);
    },
    [resource],
  );
  const institution = resource.data;

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
  if (!institution) return <LoadingState />;

  const readOnly = isArchived(institution);

  return (
    <>
      {readOnly && <Alert tone="info">This institution is archived. You can only view its information.</Alert>}
      <Card
        title={institution.name}
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
              <ConfirmActionButton
                label="Archive"
                title={`Archive ${institution.name}?`}
                description="The institution becomes read-only. Its students are kept."
                action={archive}
                onDone={resource.replace}
                icon={<TrashIcon />}
              />
            </>
          )
        }
      >
        <InstitutionDetails institution={institution} />
      </Card>

      <InstitutionStudentsSection institutionId={institution.id} readOnly={readOnly} />
      <InstitutionFormModal
        open={isEditing}
        title="Edit institution"
        submitLabel="Save changes"
        initialValues={{ name: institution.name, contactEmail: institution.contactEmail }}
        submit={update}
        onSuccess={saveInstitution}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
