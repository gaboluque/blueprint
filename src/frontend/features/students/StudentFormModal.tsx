"use client";

import { useId, useState } from "react";
import { FormActions } from "@/frontend/components/shared/FormActions";
import { Modal } from "@/frontend/components/ui/Modal";
import { StudentForm, type StudentFormValues } from "./StudentForm";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import type { StudentDto } from "@/domains/students/views/student.view";

type StudentFormModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  submit: (values: StudentFormValues) => Promise<ApiResult<StudentDto>>;
  onSuccess: (student: StudentDto) => void;
  onClose: () => void;
  initialValues?: StudentFormValues;
  idPrefix?: string;
};

export function StudentFormModal({
  open,
  title,
  submitLabel,
  submit,
  onSuccess,
  onClose,
  initialValues,
  idPrefix,
}: StudentFormModalProps) {
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
      <StudentForm
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
