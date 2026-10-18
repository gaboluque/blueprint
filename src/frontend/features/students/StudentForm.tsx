"use client";

import type { FormEvent } from "react";
import type { ApiResult } from "@/frontend/gateway/apiClient";
import type { CreateStudentBody } from "@/domains/students/validations/student.validation";
import type { StudentDto } from "@/domains/students/views/student.view";
import { DEFAULT_STUDENT_STATUS, STUDENT_STATUS_LABELS } from "@/frontend/components/admin/statusLabels";
import { useFormValues } from "@/frontend/hooks/useFormValues";
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
}: StudentFormProps) {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nombres"
          required
          value={values.firstName}
          onChange={setField("firstName")}
          error={fieldErrors.firstName}
        />
        <TextField
          label="Apellidos"
          required
          value={values.lastName}
          onChange={setField("lastName")}
          error={fieldErrors.lastName}
        />
        <TextField
          label="Correo electrónico"
          type="email"
          required
          value={values.email}
          onChange={setField("email")}
          error={fieldErrors.email}
        />
        <TextField
          label="Documento de identidad"
          required
          value={values.documentId}
          onChange={setField("documentId")}
          error={fieldErrors.documentId}
        />
        <SelectField
          label="Estado"
          value={values.status}
          options={STATUS_OPTIONS}
          onChange={setField("status")}
          error={fieldErrors.status}
        />
      </div>
      <FormActions submitLabel={submitLabel} pending={mutation.pending} onCancel={onCancel} />
    </form>
  );
}
