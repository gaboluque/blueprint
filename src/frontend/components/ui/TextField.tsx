import { useId, type InputHTMLAttributes } from "react";
import { FieldError, fieldControlClasses } from "./FieldError";
import type { InputFieldBinding } from "@/frontend/hooks/useForm";

type TextFieldControlledProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  field?: undefined;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

type TextFieldBoundProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id"> & {
  field: InputFieldBinding;
  label: string;
  value?: never;
  onChange?: never;
  error?: never;
};

type TextFieldProps = TextFieldControlledProps | TextFieldBoundProps;

export function TextField(props: TextFieldProps) {
  const generatedId = useId();

  if ("field" in props && props.field) {
    const { label, field, className, ...rest } = props;
    const { error, errorId, ...inputProps } = field;

    return (
      <div className={className}>
        <label htmlFor={inputProps.id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          {...rest}
          {...inputProps}
          aria-invalid={inputProps["aria-invalid"]}
          aria-describedby={inputProps["aria-describedby"]}
          className={fieldControlClasses(Boolean(error))}
        />
        <FieldError id={errorId} message={error} />
      </div>
    );
  }

  const { label, value, onChange, error, id, className, ...inputProps } = props;
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldControlClasses(Boolean(error))}
        {...inputProps}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
