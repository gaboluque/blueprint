"use client";

import { useEffect, useId, type FormEvent } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import {
  createInstitutionBodySchema,
  type CreateInstitutionBody,
} from "@/domains/institutions/validations/institution.validation";
import type { InstitutionDto } from "@/domains/institutions/views/institution.view";
import { useForm } from "@/frontend/hooks/useForm";
import { useMutation } from "@/frontend/hooks/useMutation";
import { FormActions } from "@/frontend/components/shared/FormActions";
import { Alert } from "@/frontend/components/ui/Alert";
import { TextField } from "@/frontend/components/ui/TextField";

export type InstitutionFormValues = CreateInstitutionBody;

type InstitutionFormProps = {
  initialValues?: InstitutionFormValues;
  submitLabel: string;
  submit: (values: InstitutionFormValues) => Promise<ApiResult<InstitutionDto>>;
  onSuccess: (institution: InstitutionDto) => void;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
  idPrefix?: string;
  formId?: string;
  showInlineActions?: boolean;
};

const EMPTY_VALUES: InstitutionFormValues = { name: "", contactEmail: "" };

export function InstitutionForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  submit,
  onSuccess,
  onCancel,
  onPendingChange,
  idPrefix = "institution",
  formId: formIdProp,
  showInlineActions = true,
}: InstitutionFormProps) {
  const generatedFormId = useId();
  const formId = formIdProp ?? generatedFormId;
  const form = useForm({
    idPrefix,
    initialValues,
    schema: createInstitutionBodySchema,
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
        <TextField label="Name" required field={form.getField("name")} />
        <TextField label="Contact email" type="email" required field={form.getField("contactEmail")} />
      </div>
      {showInlineActions ? (
        <FormActions submitLabel={submitLabel} pending={mutation.pending} onCancel={onCancel} />
      ) : null}
    </form>
  );
}
