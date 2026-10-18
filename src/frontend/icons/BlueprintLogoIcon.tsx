"use client";

import { useId, type SVGProps } from "react";
import { cx } from "@/frontend/components/ui/cx";

const PLAN_PATH = "M177 243H255V313H414M293 163V243H255M308 313V411";

/** Rolled blueprint with a floor plan; the plan lines are cut out of the sheet. */
export function BlueprintLogoIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, "");
  const gradientId = `blueprint-logo-gradient-${id}`;
  const maskId = `blueprint-logo-mask-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden
      className={cx("size-5 shrink-0", className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="52" y1="0" x2="459" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0b6fe3" />
          <stop offset="1" stopColor="#5cc2f8" />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#fff" />
          <g stroke="#000" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
            <rect x="177" y="163" width="237" height="248" rx="6" />
            <path d={PLAN_PATH} />
          </g>
        </mask>
      </defs>
      <g fill={`url(#${gradientId})`} mask={`url(#${maskId})`}>
        <path d="M52 73a33 33 0 0 1 66 0V400H52Z" />
        <path d="M133 105H459V472H82a30 30 0 0 1 0-60h20a16 16 0 0 1 16 16v6a7.5 7.5 0 0 0 15 0Z" />
      </g>
    </svg>
  );
}
