import type { ComponentProps } from "react";
import { cx } from "./cx";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-sky-600 text-white hover:bg-sky-800",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-slate-700 hover:bg-slate-100",
};

export type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", type = "button", className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
