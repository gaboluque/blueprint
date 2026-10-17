"use client";

import { useCallback, useState } from "react";

export function useFormValues<V extends Record<string, string>>(initialValues: V) {
  const [values, setValues] = useState(initialValues);
  const setField = useCallback(
    <K extends keyof V>(field: K) =>
      (value: V[K]) =>
        setValues((previous) => ({ ...previous, [field]: value })),
    [],
  );
  return { values, setField };
}
