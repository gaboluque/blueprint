"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/frontend/components/ui/Button";
import { SelectField } from "@/frontend/components/ui/SelectField";
import { TextField } from "@/frontend/components/ui/TextField";
import type { FilterField, SearchFilterField, SelectFilterField } from "./listTypes";

const SEARCH_BUTTON_LABEL = "Buscar";

type ListFiltersProps<Q> = {
  fields: FilterField<Q>[];
  query: Q;
  onChange: (partial: Partial<Q>) => void;
};

function valueOf<Q>(query: Q, name: keyof Q): string {
  const value = query[name];
  return value === undefined || value === null ? "" : String(value);
}

/** Blank values clear the filter (`undefined` is dropped from the query string). */
function patchOf<Q>(name: keyof Q, value: string): Partial<Q> {
  return { [name]: value.trim() || undefined } as Partial<Q>;
}

function SearchFilter<Q>({ field, query, onChange }: { field: SearchFilterField<Q> } & Omit<ListFiltersProps<Q>, "fields">) {
  const [draft, setDraft] = useState(() => valueOf(query, field.name));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onChange(patchOf<Q>(field.name, draft));
  };

  return (
    <form role="search" onSubmit={submit} className="flex items-end gap-2">
      <TextField
        type="search"
        label={field.label}
        value={draft}
        onChange={setDraft}
        placeholder={field.placeholder}
        className="w-64"
      />
      <Button type="submit" variant="secondary">
        {SEARCH_BUTTON_LABEL}
      </Button>
    </form>
  );
}

function SelectFilter<Q>({ field, query, onChange }: { field: SelectFilterField<Q> } & Omit<ListFiltersProps<Q>, "fields">) {
  return (
    <SelectField
      label={field.label}
      value={valueOf(query, field.name)}
      options={[{ value: "", label: field.allLabel }, ...field.options]}
      onChange={(value) => onChange(patchOf<Q>(field.name, value))}
      className="w-48"
    />
  );
}

export function ListFilters<Q>({ fields, query, onChange }: ListFiltersProps<Q>) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-4">
      {fields.map((field) =>
        field.type === "search" ? (
          <SearchFilter
            key={`${field.name}:${valueOf(query, field.name)}`}
            field={field}
            query={query}
            onChange={onChange}
          />
        ) : (
          <SelectFilter key={field.name} field={field} query={query} onChange={onChange} />
        ),
      )}
    </div>
  );
}
