"use client";

import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";
import type { FieldErrors } from "@/lib/errors/domain.errors";
import { Validation } from "@/lib/validation/validation";

export type FieldAdapter<TValue> = {
  formatter: (value: TValue) => string;
  parser: (raw: string) => TValue | undefined;
};

type FieldPath<T> = Extract<keyof T, string>;

export type InputFieldBinding<K extends string = string> = {
  error?: string;
  errorId: string;
  id: string;
  name: K;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur: () => void;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
};

export type SelectFieldBinding<K extends string = string> = {
  error?: string;
  errorId: string;
  id: string;
  name: K;
  value: string;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
};

export type CheckboxFieldBinding<K extends string = string> = {
  error?: string;
  errorId: string;
  id: string;
  name: K;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onBlur: () => void;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
};

type GetFieldOptions<T, K extends FieldPath<T>> = {
  adapter?: FieldAdapter<T[K]>;
  normalizeOnBlur?: (raw: string) => string;
  select?: boolean;
  checkbox?: boolean;
};

export type UseFormOptions<T extends Record<string, unknown>> = {
  idPrefix: string;
  initialValues: T;
  schema: z.ZodType<T>;
};

export type UseFormReturn<T extends Record<string, unknown>> = {
  idPrefix: string;
  values: T;
  errors: Partial<Record<FieldPath<T>, string>>;
  generalError: string | null;
  setGeneralError: (message: string | null) => void;
  setField: <K extends FieldPath<T>>(name: K, value: T[K]) => void;
  setValues: (patch: Partial<T>) => void;
  clearErrors: (names?: FieldPath<T>[]) => void;
  setFieldError: (name: FieldPath<T>, message: string | null) => void;
  applyFieldErrors: (fieldErrors: FieldErrors) => void;
  validate: () => { ok: true; data: T } | { ok: false };
  validateSchema: <S extends z.ZodTypeAny>(schema: S) => { ok: true; data: z.infer<S> } | { ok: false };
  getField: {
    <K extends FieldPath<T>>(name: K, adapter?: FieldAdapter<T[K]>): InputFieldBinding<K>;
    <K extends FieldPath<T>>(name: K, options: GetFieldOptions<T, K> & { select: true }): SelectFieldBinding<K>;
    <K extends FieldPath<T>>(name: K, options: GetFieldOptions<T, K> & { checkbox: true }): CheckboxFieldBinding<K>;
    <K extends FieldPath<T>>(
      name: K,
      options: GetFieldOptions<T, K> & { select?: undefined; checkbox?: undefined },
    ): InputFieldBinding<K>;
  };
  getFieldError: (name: FieldPath<T>) => string | undefined;
  reset: (nextValues?: T) => void;
};

const ROOT_FIELD = "_root";

export function useForm<T extends Record<string, unknown>>({
  idPrefix,
  initialValues,
  schema,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<FieldPath<T>, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldPath<T>, boolean>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const getFieldErrorId = useCallback((name: FieldPath<T>) => `${idPrefix}-${name}-error`, [idPrefix]);

  const schemaFieldErrors = useMemo(() => {
    const result = schema.safeParse(values);
    if (result.success) return {} as Partial<Record<FieldPath<T>, string>>;
    return Validation.fieldErrorsOf(result.error) as Partial<Record<FieldPath<T>, string>>;
  }, [schema, values]);

  const resolvedErrors = useMemo(() => {
    const next: Partial<Record<FieldPath<T>, string>> = { ...errors };
    for (const name of Object.keys(touched) as FieldPath<T>[]) {
      if (!touched[name]) continue;
      const schemaMessage = schemaFieldErrors[name];
      if (schemaMessage) next[name] = schemaMessage;
      else if (!errors[name]) delete next[name];
    }
    return next;
  }, [errors, schemaFieldErrors, touched]);

  const setField = useCallback(<K extends FieldPath<T>>(name: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [name]: value }));
    setGeneralError(null);
  }, []);

  const setValues = useCallback((patch: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...patch }));
    setGeneralError(null);
    const keys = Object.keys(patch) as FieldPath<T>[];
    if (keys.length === 0) return;
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
  }, []);

  const clearErrors = useCallback((names?: FieldPath<T>[]) => {
    if (!names) {
      setErrors({});
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      for (const name of names) delete next[name];
      return next;
    });
  }, []);

  const setFieldError = useCallback((name: FieldPath<T>, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
    if (message) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  }, []);

  const applyFieldErrors = useCallback(
    (fieldErrors: FieldErrors) => {
      for (const [key, message] of Object.entries(fieldErrors)) {
        if (key === ROOT_FIELD) {
          setGeneralError(message);
          continue;
        }
        setFieldError(key as FieldPath<T>, message);
      }
    },
    [setFieldError],
  );

  const applyValidationErrors = useCallback((error: z.ZodError) => {
    const fieldErrors = Validation.fieldErrorsOf(error) as Partial<Record<FieldPath<T>, string>>;
    setErrors(fieldErrors);
    setTouched((prev) => {
      const next = { ...prev };
      for (const name of Object.keys(fieldErrors) as FieldPath<T>[]) {
        if (name === ROOT_FIELD) continue;
        next[name] = true;
      }
      return next;
    });
    if (fieldErrors[ROOT_FIELD as FieldPath<T>]) {
      setGeneralError(fieldErrors[ROOT_FIELD as FieldPath<T>] ?? null);
    }
  }, []);

  const validateSchema = useCallback(
    <S extends z.ZodTypeAny>(stepSchema: S) => {
      const result = stepSchema.safeParse(values);
      if (!result.success) {
        applyValidationErrors(result.error);
        return { ok: false as const };
      }
      setErrors({});
      return { ok: true as const, data: result.data };
    },
    [applyValidationErrors, values],
  );

  const validate = useCallback(() => {
    const result = schema.safeParse(values);
    if (!result.success) {
      applyValidationErrors(result.error);
      return { ok: false as const };
    }
    setErrors({});
    return { ok: true as const, data: result.data };
  }, [applyValidationErrors, schema, values]);

  const reset = useCallback(
    (nextValues?: T) => {
      setValuesState(nextValues ?? initialValues);
      setErrors({});
      setTouched({});
      setGeneralError(null);
    },
    [initialValues],
  );

  const getFieldProps = useCallback(
    <K extends FieldPath<T>>(name: K, adapter?: FieldAdapter<T[K]>) => {
      const rawValue = values[name];
      const displayValue = adapter
        ? adapter.formatter(rawValue)
        : rawValue === undefined || rawValue === null
          ? ""
          : String(rawValue);
      const error = resolvedErrors[name];
      const errorId = getFieldErrorId(name);

      return {
        id: `${idPrefix}-${name}`,
        name,
        value: displayValue,
        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
          const nextRaw = event.target.value;
          if (adapter) {
            const parsed = adapter.parser(nextRaw);
            if (parsed === undefined && nextRaw !== "") return;
            setField(name, parsed as T[K]);
            return;
          }
          setField(name, nextRaw as T[K]);
        },
        onBlur: () => {
          setTouched((prev) => ({ ...prev, [name]: true }));
        },
        "aria-invalid": touched[name] && error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      };
    },
    [getFieldErrorId, idPrefix, resolvedErrors, setField, touched, values],
  );

  const getSelectFieldProps = useCallback(
    <K extends FieldPath<T>>(name: K) => {
      const rawValue = values[name];
      const displayValue = rawValue === undefined || rawValue === null ? "" : String(rawValue);
      const error = resolvedErrors[name];
      const errorId = getFieldErrorId(name);

      return {
        id: `${idPrefix}-${name}`,
        name,
        value: displayValue,
        onValueChange: (value: string) => {
          setField(name, value as T[K]);
        },
        onBlur: () => {
          setTouched((prev) => ({ ...prev, [name]: true }));
        },
        "aria-invalid": touched[name] && error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      };
    },
    [getFieldErrorId, idPrefix, resolvedErrors, setField, touched, values],
  );

  const getCheckboxFieldProps = useCallback(
    <K extends FieldPath<T>>(name: K) => {
      const error = resolvedErrors[name];
      const errorId = getFieldErrorId(name);

      return {
        id: `${idPrefix}-${name}`,
        name,
        checked: Boolean(values[name]),
        onCheckedChange: (checked: boolean) => {
          setField(name, checked as T[K]);
        },
        onBlur: () => {
          setTouched((prev) => ({ ...prev, [name]: true }));
        },
        "aria-invalid": touched[name] && error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      };
    },
    [getFieldErrorId, idPrefix, resolvedErrors, setField, touched, values],
  );

  const getFieldError = useCallback(
    (name: FieldPath<T>) => (touched[name] ? resolvedErrors[name] : undefined),
    [resolvedErrors, touched],
  );

  const getField = useCallback(
    <K extends FieldPath<T>>(name: K, adapterOrOptions?: FieldAdapter<T[K]> | GetFieldOptions<T, K>) => {
      const options =
        adapterOrOptions &&
        typeof adapterOrOptions === "object" &&
        ("select" in adapterOrOptions ||
          "checkbox" in adapterOrOptions ||
          "adapter" in adapterOrOptions ||
          "normalizeOnBlur" in adapterOrOptions)
          ? (adapterOrOptions as GetFieldOptions<T, K>)
          : { adapter: adapterOrOptions as FieldAdapter<T[K]> | undefined };

      const error = touched[name] ? resolvedErrors[name] : undefined;
      const errorId = getFieldErrorId(name);

      if (options.select) {
        const props = getSelectFieldProps(name);
        return { error, errorId, ...props };
      }

      if (options.checkbox) {
        const props = getCheckboxFieldProps(name);
        return { error, errorId, ...props };
      }

      const props = getFieldProps(name, options.adapter);
      const normalizeOnBlur = options.normalizeOnBlur;
      if (!normalizeOnBlur) {
        return { error, errorId, ...props };
      }

      return {
        error,
        errorId,
        ...props,
        onBlur: () => {
          props.onBlur();
          const current = values[name];
          if (typeof current !== "string") return;
          const next = normalizeOnBlur(current);
          if (next !== current) {
            setField(name, next as T[K]);
          }
        },
      };
    },
    [
      getFieldErrorId,
      getCheckboxFieldProps,
      getFieldProps,
      getSelectFieldProps,
      resolvedErrors,
      setField,
      touched,
      values,
    ],
  ) as UseFormReturn<T>["getField"];

  return useMemo(
    () => ({
      idPrefix,
      values,
      errors: resolvedErrors,
      generalError,
      setGeneralError,
      setField,
      setValues,
      clearErrors,
      setFieldError,
      applyFieldErrors,
      validate,
      validateSchema,
      getField,
      getFieldError,
      reset,
    }),
    [
      idPrefix,
      applyFieldErrors,
      clearErrors,
      setFieldError,
      resolvedErrors,
      generalError,
      getField,
      getFieldError,
      reset,
      setField,
      setValues,
      validate,
      validateSchema,
      values,
    ],
  );
}
