import type { ReactNode } from "react";

export type DescriptionItem = { term: string; detail: ReactNode };

export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.term}</dt>
          <dd className="mt-1 text-sm text-slate-900">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
