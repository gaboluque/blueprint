import type { TextareaHTMLAttributes } from "react";
import { FieldError, fieldControlClasses } from "./FieldError";
import { FieldHint } from "./FieldHint";
import type { InputFieldBinding } from "@/frontend/hooks/useForm";

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "id"> & {
  label: string;
  field: InputFieldBinding;
  hint?: string;
};

export function TextareaField({ label, field, hint, className, ...rest }: TextareaFieldProps) {
  const { error, errorId, ...textareaProps } = field;

  return (
    <div className={className}>
      <label htmlFor={textareaProps.id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea {...rest} {...textareaProps} className={fieldControlClasses(Boolean(error))} />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
