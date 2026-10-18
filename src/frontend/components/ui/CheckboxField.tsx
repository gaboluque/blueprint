import { FieldError, fieldControlClasses } from "./FieldError";
import { FieldHint } from "./FieldHint";
import type { CheckboxFieldBinding } from "@/frontend/hooks/useForm";

type CheckboxFieldProps = {
  label: string;
  field: CheckboxFieldBinding;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CheckboxField({ label, field, hint, required, disabled }: CheckboxFieldProps) {
  const {
    error,
    errorId,
    id,
    name,
    checked,
    onCheckedChange,
    onBlur,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
  } = field;

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={fieldControlClasses(Boolean(error))}
        />
        <div>
          <label htmlFor={id} className="text-sm font-medium text-slate-700">
            {label}
          </label>
          {hint ? <FieldHint>{hint}</FieldHint> : null}
        </div>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
