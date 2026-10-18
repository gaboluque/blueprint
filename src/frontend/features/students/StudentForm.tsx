"use client";

import { useEffect, useId, type FormEvent } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import { createStudentBodySchema, type CreateStudentBody } from "@/domains/students/validations/student.validation";
import type { StudentDto } from "@/domains/students/views/student.view";
import { DEFAULT_STUDENT_STATUS, STUDENT_STATUS_LABELS } from "@/frontend/components/admin/statusLabels";
import { useForm } from "@/frontend/hooks/useForm";
import { useMutation } from "@/frontend/hooks/useMutation";
import { FormActions } from "@/frontend/components/shared/FormActions";
import { recordToOptions } from "@/frontend/components/shared/listTypes";
import { Alert } from "@/frontend/components/ui/Alert";
import { SelectField } from "@/frontend/components/ui/SelectField";
import { TextField } from "@/frontend/components/ui/TextField";

export type StudentFormValues = CreateStudentBody;

type StudentFormProps = {
  initialValues?: StudentFormValues;
  submitLabel: string;
  submit: (values: StudentFormValues) => Promise<ApiResult<StudentDto>>;
  onSuccess: (student: StudentDto) => void;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  idPrefix?: string;
  formId?: string;
  showInlineActions?: boolean;
};

const EMPTY_VALUES: StudentFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  documentId: "",
  status: DEFAULT_STUDENT_STATUS,
};

const STATUS_OPTIONS = recordToOptions(STUDENT_STATUS_LABELS);

export function StudentForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  submit,
  onSuccess,
  onCancel,
  onPendingChange,
  idPrefix = "student",
  formId: formIdProp,
  showInlineActions = true,
}: StudentFormProps) {
  const generatedFormId = useId();
  const formId = formIdProp ?? generatedFormId;
  const form = useForm({
    idPrefix,
    initialValues,
    schema: createStudentBodySchema,
  });
  const mutation = useMutation(submit);

  useEffect(() => {
    onPendingChange?.(mutation.pending);
  }, [mutation.pending, onPendingChange]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    form.setGeneralError(null);

    const validated = form.validate();
    if (!validated.ok) return;

    const result = await mutation.run(validated.data);
    if (!result.ok) {
      form.applyFieldErrors(result.fieldErrors ?? {});
      return;
    }
    onSuccess(result.data);
  };

  const bannerMessage = mutation.error && (mutation.fieldErrors._root ?? form.generalError ?? mutation.error);

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4" aria-label={submitLabel}>
      {bannerMessage ? <Alert>{bannerMessage}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" required field={form.getField("firstName")} />
        <TextField label="Last name" required field={form.getField("lastName")} />
        <TextField label="Email" type="email" required field={form.getField("email")} />
        <TextField label="Document ID" required field={form.getField("documentId")} />
        <SelectField label="Status" options={STATUS_OPTIONS} field={form.getField("status", { select: true })} />
      </div>
      {showInlineActions ? (
        <FormActions submitLabel={submitLabel} pending={mutation.pending} onCancel={onCancel} />
      ) : null}
    </form>
  );
}
