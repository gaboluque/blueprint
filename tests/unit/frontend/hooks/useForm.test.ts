/** @jest-environment jsdom */

import { renderHook, act } from "@testing-library/react";
import { z } from "zod";
import { createInstitutionBodySchema } from "@/domains/institutions/validations/institution.validation";
import { useForm } from "@/frontend/hooks/useForm";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  quantity: z.number().positive("Invalid quantity.").optional(),
});

describe("useForm", () => {
  it("validates on submit and exposes field errors after blur", () => {
    const { result } = renderHook(() =>
      useForm({
        idPrefix: "test",
        initialValues: { name: "", quantity: undefined },
        schema,
      }),
    );

    act(() => {
      const validated = result.current.validate();
      expect(validated.ok).toBe(false);
    });

    act(() => {
      result.current.getField("name").onBlur();
    });

    expect(result.current.getField("name").error).toBe("Name is required.");
  });

  it("parses numeric field adapters", () => {
    const { result } = renderHook(() =>
      useForm({
        idPrefix: "test",
        initialValues: { name: "North", quantity: undefined },
        schema,
      }),
    );

    act(() => {
      result.current
        .getField("quantity", {
          formatter: (value) => (value === undefined ? "" : String(value)),
          parser: (raw) => (raw === "" ? undefined : Number(raw)),
        })
        .onChange({
          target: { value: "12" },
        } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.quantity).toBe(12);
  });

  it("applies server field errors and keeps them when client schema passes", () => {
    const { result } = renderHook(() =>
      useForm({
        idPrefix: "institution",
        initialValues: { name: "North", contactEmail: "a@test.dev" },
        schema: createInstitutionBodySchema,
      }),
    );

    act(() => {
      result.current.applyFieldErrors({ contactEmail: "This email is already in use." });
    });

    expect(result.current.getField("contactEmail").error).toBe("This email is already in use.");
  });

  it("binds checkbox checked state and onCheckedChange", () => {
    const checkboxSchema = z.object({
      accepted: z.literal(true, { error: "Required." }),
    });

    const { result } = renderHook(() =>
      useForm({
        idPrefix: "test",
        initialValues: { accepted: false },
        schema: checkboxSchema,
      }),
    );

    expect(result.current.getField("accepted", { checkbox: true }).checked).toBe(false);

    act(() => {
      result.current.getField("accepted", { checkbox: true }).onCheckedChange(true);
    });

    expect(result.current.values.accepted).toBe(true);
  });
});
