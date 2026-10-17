const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

function codeOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  // Drizzle wraps driver errors in DrizzleQueryError with the pg error as `cause`.
  if ("cause" in error) return codeOf(error.cause);
  return undefined;
}

function isUniqueViolation(error: unknown): boolean {
  return codeOf(error) === UNIQUE_VIOLATION;
}

function isForeignKeyViolation(error: unknown): boolean {
  return codeOf(error) === FOREIGN_KEY_VIOLATION;
}

export const PgErrors = { codeOf, isUniqueViolation, isForeignKeyViolation };
