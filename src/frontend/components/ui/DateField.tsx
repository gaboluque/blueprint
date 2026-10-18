import type { InputHTMLAttributes } from "react";
import { FieldError, fieldControlClasses } from "./FieldError";
import type { InputFieldBinding } from "@/frontend/hooks/useForm";

type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id" | "type"> & {
  label: string;
  field: InputFieldBinding;
  min?: string;
  max?: string;
};

export function DateField({ label, field, min, max, className, ...rest }: DateFieldProps) {
  const { error, errorId, onChange, onBlur, ...inputProps } = field;

  return (
    <div className={className}>
      <label htmlFor={inputProps.id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="date"
        min={min}
        max={max}
        {...rest}
        {...inputProps}
        onChange={(event) => {
          onChange(event);
          onBlur();
        }}
        onBlur={onBlur}
        className={fieldControlClasses(Boolean(error))}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
