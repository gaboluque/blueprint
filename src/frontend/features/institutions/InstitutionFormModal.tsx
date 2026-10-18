"use client";

import { useId, useState } from "react";
import { FormActions } from "@/frontend/components/shared/FormActions";
import { Modal } from "@/frontend/components/ui/Modal";
import { InstitutionForm, type InstitutionFormValues } from "./InstitutionForm";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import type { InstitutionDto } from "@/domains/institutions/views/institution.view";

type InstitutionFormModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  submit: (values: InstitutionFormValues) => Promise<ApiResult<InstitutionDto>>;
  onSuccess: (institution: InstitutionDto) => void;
  onClose: () => void;
  initialValues?: InstitutionFormValues;
  idPrefix?: string;
};

export function InstitutionFormModal({
  open,
  title,
  submitLabel,
  submit,
  onSuccess,
  onClose,
  initialValues,
  idPrefix,
}: InstitutionFormModalProps) {
  const formId = useId();
  const [submitPending, setSubmitPending] = useState(false);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      closeDisabled={submitPending}
      footer={<FormActions formId={formId} submitLabel={submitLabel} pending={submitPending} onCancel={onClose} />}
    >
      <InstitutionForm
        formId={formId}
        showInlineActions={false}
        initialValues={initialValues}
        idPrefix={idPrefix}
        submitLabel={submitLabel}
        submit={submit}
        onSuccess={onSuccess}
        onCancel={onClose}
        onPendingChange={setSubmitPending}
      />
    </Modal>
  );
}
