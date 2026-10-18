import type { InputHTMLAttributes } from "react";
import { FieldError, fieldControlClasses } from "./FieldError";
import type { InputFieldBinding } from "@/frontend/hooks/useForm";

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id" | "type"> & {
  label: string;
  field: InputFieldBinding;
};

export function NumberField({ label, field, className, ...rest }: NumberFieldProps) {
  const { error, errorId, onChange, ...inputProps } = field;

  return (
    <div className={className}>
      <label htmlFor={inputProps.id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        inputMode="numeric"
        {...rest}
        {...inputProps}
        onChange={(event) => {
          const next = event.target.value;
          if (next !== "" && !/^\d+$/.test(next)) return;
          onChange(event);
        }}
        className={fieldControlClasses(Boolean(error))}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
