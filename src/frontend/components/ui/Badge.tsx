import type { ReactNode } from "react";
import { cx } from "./cx";

export type BadgeTone = "success" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-emerald-100 text-emerald-800",
  neutral: "bg-slate-200 text-slate-700",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}
