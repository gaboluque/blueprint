import type { ComponentProps, ReactNode } from "react";
import { forwardRef } from "react";
import { cx } from "./cx";

type CardProps = ComponentProps<"section"> & {
  title?: string;
  titleId?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { title, titleId, actions, footer, children, className, ...sectionProps },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cx("flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm", className)}
      {...sectionProps}
    >
      {(title || actions) && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3 sm:p-4">
          {title && (
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx("p-3 sm:p-4", footer ? "min-h-0 flex-1 overflow-y-auto" : "")}>{children}</div>
      {footer ? <div className="mt-auto shrink-0 border-t border-slate-200 p-3 sm:p-4">{footer}</div> : null}
    </section>
  );
});
