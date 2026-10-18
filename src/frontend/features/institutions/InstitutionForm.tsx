"use client";

import type { FormEvent } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import type { CreateInstitutionBody } from "@/domains/institutions/validations/institution.validation";
import type { InstitutionDto } from "@/domains/institutions/views/institution.view";
import { useFormValues } from "@/frontend/hooks/useFormValues";
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
};

const EMPTY_VALUES: InstitutionFormValues = { name: "", slug: "", contactEmail: "" };

export function InstitutionForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  submit,
  onSuccess,
  onCancel,
}: InstitutionFormProps) {
  const { values, setField } = useFormValues(initialValues);
  const mutation = useMutation(submit);
  const { fieldErrors } = mutation;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await mutation.run(values);
    if (result.ok) onSuccess(result.data);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label={submitLabel}>
      {mutation.error && <Alert>{fieldErrors._root ?? mutation.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Name" required value={values.name} onChange={setField("name")} error={fieldErrors.name} />
        <TextField label="Slug" required value={values.slug} onChange={setField("slug")} error={fieldErrors.slug} />
        <TextField
          label="Contact email"
          type="email"
          required
          value={values.contactEmail}
          onChange={setField("contactEmail")}
          error={fieldErrors.contactEmail}
        />
      </div>
      <FormActions submitLabel={submitLabel} pending={mutation.pending} onCancel={onCancel} />
    </form>
  );
}
