import { z } from "zod";
import { InputParseError, type FieldErrors } from "@/lib/errors/domain.errors";

// Spanish default messages for every schema in the app.
z.config(z.locales.es());

const INVALID_INPUT_MESSAGE = "Revisa los datos enviados.";
const ROOT_FIELD = "_root";

function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  const keyOf = (path: PropertyKey[]) => (path.length > 0 ? path.map(String).join(".") : ROOT_FIELD);
  for (const issue of error.issues) {
    // Report each rejected key under its own name instead of the parent object.
    const paths = issue.code === "unrecognized_keys" ? issue.keys.map((key) => [...issue.path, key]) : [issue.path];
    for (const path of paths) fieldErrors[keyOf(path)] ??= issue.message;
  }
  return fieldErrors;
}

function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new InputParseError(INVALID_INPUT_MESSAGE, fieldErrorsOf(result.error));
  return result.data;
}

export const Validation = { parse, fieldErrorsOf };
