import type { SelectOption } from "@/frontend/components/ui/SelectField";
import type { PaginationQuery } from "@/lib/pagination";

export type ListQuery = PaginationQuery;

type BaseFilterField<Q> = {
  name: keyof Q & string;
  label: string;
};

/** Commits on **Search** or Enter. */
export type SearchFilterField<Q> = BaseFilterField<Q> & {
  type: "search";
  placeholder?: string;
};

/** Applies immediately. The empty option clears the filter. */
export type SelectFilterField<Q> = BaseFilterField<Q> & {
  type: "select";
  allLabel: string;
  options: SelectOption[];
};

export type FilterField<Q> = SearchFilterField<Q> | SelectFilterField<Q>;

export function recordToOptions<K extends string>(labels: Record<K, string>): SelectOption<K>[] {
  return (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));
}
