import { useId } from "react";
import { FieldError, fieldControlClasses } from "./FieldError";
import type { SelectFieldBinding } from "@/frontend/hooks/useForm";

export type SelectOption<V extends string = string> = { value: V; label: string };

type SelectFieldControlledProps<V extends string> = {
  field?: undefined;
  label: string;
  value: V;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  error?: string;
  name?: string;
  className?: string;
};

type SelectFieldBoundProps = {
  field: SelectFieldBinding;
  label: string;
  options: SelectOption[];
  value?: never;
  onChange?: never;
  error?: never;
  name?: never;
  className?: string;
};

type SelectFieldProps<V extends string> = SelectFieldControlledProps<V> | SelectFieldBoundProps;

export function SelectField<V extends string>(props: SelectFieldProps<V>) {
  const generatedId = useId();

  if ("field" in props && props.field) {
    const { label, field, options, className } = props;
    const {
      error,
      errorId,
      id,
      name,
      value,
      onValueChange,
      onBlur,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
    } = field;

    return (
      <div className={className}>
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
        <select
          id={id}
          name={name}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={fieldControlClasses(Boolean(error))}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError id={errorId} message={error} />
      </div>
    );
  }

  const { label, value, options, onChange, error, name, className } = props;
  const errorId = `${generatedId}-error`;

  const onSelect = (selected: string) => {
    const option = options.find((candidate) => candidate.value === selected);
    if (option) onChange(option.value);
  };

  return (
    <div className={className}>
      <label htmlFor={generatedId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={generatedId}
        name={name}
        value={value}
        onChange={(event) => onSelect(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldControlClasses(Boolean(error))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
