import type { ReactNode, SVGProps } from "react";
import { cx } from "@/frontend/components/ui/cx";

export type StrokeIconProps = SVGProps<SVGSVGElement>;

export const STROKE_PATH_PROPS = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function StrokeIcon({ className, children, ...props }: StrokeIconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cx("size-5", className)}
      {...props}
    >
      {children}
    </svg>
  );
}
