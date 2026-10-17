import { useId } from "react";
import { FieldError, fieldControlClasses } from "./FieldError";

export type SelectOption<V extends string = string> = { value: V; label: string };

type SelectFieldProps<V extends string> = {
  label: string;
  value: V;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  error?: string;
  name?: string;
  className?: string;
};

export function SelectField<V extends string>({
  label,
  value,
  options,
  onChange,
  error,
  name,
  className,
}: SelectFieldProps<V>) {
  const selectId = useId();
  const errorId = `${selectId}-error`;

  const onSelect = (selected: string) => {
    const option = options.find((candidate) => candidate.value === selected);
    if (option) onChange(option.value);
  };

  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={selectId}
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
