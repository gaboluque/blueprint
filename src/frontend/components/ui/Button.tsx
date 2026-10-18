import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonIconPosition = "start" | "end";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-sky-600 text-white hover:bg-sky-800",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-slate-700 hover:bg-slate-100",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-8 px-2.5 py-1 text-xs",
  md: "min-h-10 px-3 py-2 text-sm",
  lg: "min-h-12 px-4 py-3 text-base",
};

const ICON_ONLY_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-8 min-w-8 px-0",
  md: "min-h-10 min-w-10 px-0",
  lg: "min-h-12 min-w-12 px-0",
};

const ICON_SLOT_CLASSES: Record<ButtonSize, string> = {
  sm: "inline-flex shrink-0 [&_svg]:size-3.5",
  md: "inline-flex shrink-0 [&_svg]:size-4",
  lg: "inline-flex shrink-0 [&_svg]:size-5",
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: ButtonIconPosition;
};

function ButtonIconSlot({ size, children }: { size: ButtonSize; children: ReactNode }) {
  return <span className={ICON_SLOT_CLASSES[size]}>{children}</span>;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  icon,
  iconPosition = "start",
  className,
  children,
  ...props
}: ButtonProps) {
  const iconOnly = icon != null && (children == null || children === false);

  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center rounded-md font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        iconOnly ? ICON_ONLY_SIZE_CLASSES[size] : SIZE_CLASSES[size],
        !iconOnly && icon != null && "gap-2",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {iconOnly ? (
        <ButtonIconSlot size={size}>{icon}</ButtonIconSlot>
      ) : (
        <>
          {icon != null && iconPosition === "start" ? <ButtonIconSlot size={size}>{icon}</ButtonIconSlot> : null}
          {children}
          {icon != null && iconPosition === "end" ? <ButtonIconSlot size={size}>{icon}</ButtonIconSlot> : null}
        </>
      )}
    </button>
  );
}
