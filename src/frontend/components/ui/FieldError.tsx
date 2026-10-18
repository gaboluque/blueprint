import { cx } from "./cx";

export function fieldControlClasses(invalid: boolean): string {
  return cx(
    "block min-h-10 w-full rounded-md border bg-white px-3 py-2 text-sm",
    "focus:outline-2 focus:outline-offset-0 focus:outline-sky-600",
    invalid ? "border-red-600" : "border-slate-300",
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  );
}
