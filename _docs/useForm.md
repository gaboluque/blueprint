# useForm

Client-side form state for admin features. `AGENTS.md` lists hooks at a glance; this doc is the reference for wiring forms, field components, and API errors.

**Source:** `src/frontend/hooks/useForm.ts`  
**Tests:** `tests/unit/frontend/hooks/useForm.test.ts`  
**Reference forms:** `InstitutionForm.tsx`, `StudentForm.tsx`, `LoginForm.tsx`

---

## Role in the stack

```
Zod schema (often same as API body) → useForm → *Field components → submit → useMutation → gateway
```

- **Validation messages** come from the same Zod schemas the API uses (via `Validation.fieldErrorsOf`), so copy stays aligned with server rules.
- **Submit payloads** should always go through `form.validate()` (or `validateSchema` for multi-step flows) before calling the gateway.
- **Server `fieldErrors`** from `ApiResult` map back onto fields with `applyFieldErrors`.

Forms use `noValidate` on `<form>` so the browser does not fight Zod. Native `required` on fields is still fine for accessibility hints.

---

## Basic setup

```ts
const form = useForm({
  idPrefix: "institution", // stable prefix for id / aria ids on this form instance
  initialValues: { name: "", contactEmail: "" },
  schema: createInstitutionBodySchema,
});
```

| Option          | Purpose                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `idPrefix`      | Builds `{idPrefix}-{field}` and `{idPrefix}-{field}-error` for labels and `FieldError`. Use a unique prefix when two forms can appear on one page. |
| `initialValues` | Shape must match `schema` output type `T`.                                                                                                         |
| `schema`        | Full-form Zod type used by `validate()` and for live errors on **touched** fields.                                                                 |

Reuse domain body schemas from `domains/*/validations/*.validation.ts` when the form matches a create/update body. Auth-only forms may use `lib/auth/*.validation.ts` (e.g. `signInBodySchema`).

---

## Submit pattern (with `useMutation`)

Canonical flow in feature forms:

1. `event.preventDefault()`
2. `form.setGeneralError(null)`
3. `const validated = form.validate()` — on failure, all invalid fields are marked touched and errors show
4. `await mutation.run(validated.data)`
5. On `!result.ok`, `form.applyFieldErrors(result.fieldErrors ?? {})`
6. On success, navigate or call `onSuccess`

```tsx
const onSubmit = async (event: FormEvent) => {
  event.preventDefault();
  form.setGeneralError(null);

  const validated = form.validate();
  if (!validated.ok) return;

  const result = await mutation.run(validated.data);
  if (!result.ok) {
    form.applyFieldErrors(result.fieldErrors ?? {});
    return;
  }
  onSuccess(result.data);
};
```

**Banner errors:** combine mutation top-level error with `_root` field errors and `form.generalError`:

```tsx
const bannerMessage = mutation.error && (mutation.fieldErrors._root ?? form.generalError ?? mutation.error);
```

`applyFieldErrors` maps `_root` to `generalError`; other keys become field errors (and mark those fields touched).

---

## Field bindings (`getField`)

Pass the return value of `getField(name)` into UI primitives via the `field` prop. Bindings include `id`, `name`, value handlers, `error`, `errorId`, and `aria-*` for errors.

| Call                                       | Binding type           | Use with                                                                                                  |
| ------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `getField("name")`                         | `InputFieldBinding`    | `TextField`, `TextareaField`, `DateField`, `NumberField` (with optional input filtering in the component) |
| `getField("status", { select: true })`     | `SelectFieldBinding`   | `SelectField` (`onValueChange`)                                                                           |
| `getField("accepted", { checkbox: true })` | `CheckboxFieldBinding` | `CheckboxField` (`checked` / `onCheckedChange`)                                                           |

Example:

```tsx
<TextField label="Name" required field={form.getField("name")} />
<SelectField label="Status" options={STATUS_OPTIONS} field={form.getField("status", { select: true })} />
```

`TextField` also supports a **controlled** mode (`value` + `onChange`) without `useForm` — use that for filters and list query UI, not for create/edit forms.

---

## Validation timing

| When                            | Behavior                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| While typing                    | Values update; field errors for **untouched** fields stay hidden (`getField(...).error` is undefined until blur). |
| On blur                         | Field marked touched; if schema fails for that field, error appears.                                              |
| On `validate()` / failed submit | All schema failures applied; every failing field marked touched.                                                  |
| After `setValues(patch)`        | Errors cleared for keys in `patch`.                                                                               |
| After successful `validate()`   | Explicit `errors` state cleared (touched state kept until `reset`).                                               |

**Server-only errors** set via `applyFieldErrors` or `setFieldError` show even when the client schema passes (see tests for conflict email).

---

## Non-string values (adapters)

Inputs are strings in the DOM. For numbers, dates, or optional numeric fields, pass a `FieldAdapter`:

```ts
form.getField("quantity", {
  formatter: (value) => (value === undefined ? "" : String(value)),
  parser: (raw) => (raw === "" ? undefined : Number(raw)),
});
```

- **Parser** returns `undefined` to reject invalid partial input (e.g. non-numeric) without updating state.
- Empty string → `undefined` is a common pattern for optional numbers.

`normalizeOnBlur` (second argument as options object) runs after blur on **string** fields — e.g. trim email:

```ts
form.getField("email", { normalizeOnBlur: (raw) => raw.trim() });
```

Do not pass both a bare adapter object and `select`/`checkbox` flags; use `{ adapter, normalizeOnBlur }` when combining options.

---

## API surface (quick reference)

| Member                          | Purpose                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `values`                        | Current form state                                                                    |
| `errors`                        | Resolved errors (explicit + schema for touched fields)                                |
| `generalError`                  | Form-level message (often from `_root`)                                               |
| `setField` / `setValues`        | Imperative updates; clears `generalError`; `setValues` clears errors for patched keys |
| `clearErrors` / `setFieldError` | Manual error control                                                                  |
| `applyFieldErrors`              | Map API `FieldErrors` (including `_root`)                                             |
| `validate()`                    | Parse with main `schema`; returns `{ ok: true, data }` or `{ ok: false }`             |
| `validateSchema(stepSchema)`    | Same as `validate` but with a different Zod schema (wizard steps)                     |
| `getField` / `getFieldError`    | Bindings and error lookup                                                             |
| `reset(nextValues?)`            | Reset values (default `initialValues`), errors, touched, general error                |

Exported types for field components: `InputFieldBinding`, `SelectFieldBinding`, `CheckboxFieldBinding`, `FieldAdapter`, `UseFormOptions`, `UseFormReturn`.

---

## Testing

Hook tests live in `tests/unit/frontend/hooks/useForm.test.ts` (`jsdom`). Use `@testing-library/react` `renderHook` + `act`. Cover submit validation, adapters, server field errors, and checkbox bindings when you change hook behavior.

---

## Checklist for a new form

1. Define or reuse a Zod body schema and `type` from validations.
2. `useForm({ idPrefix, initialValues, schema })`.
3. Wire fields with `getField` (+ `select` / `checkbox` / adapter as needed).
4. Submit: `validate()` → `useMutation` → `applyFieldErrors` on failure.
5. Show `Alert` for banner message pattern above.
6. Add or extend unit tests if hook behavior changes; form smoke coverage often lives in page/component tests.
