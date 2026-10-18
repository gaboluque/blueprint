import type { ReactNode } from "react";
import { cx } from "./cx";

type AlertTone = "error" | "info";

const TONE_CLASSES: Record<AlertTone, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-amber-200 bg-amber-50 text-amber-900",
};

/** Errors use `role="alert"` so screen readers announce them; info is a polite status. */
export function Alert({
  tone = "error",
  children,
  action,
}: {
  tone?: AlertTone;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
        TONE_CLASSES[tone],
      )}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}
