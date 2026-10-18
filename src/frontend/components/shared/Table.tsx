import type { ReactNode } from "react";
import { cx } from "@/frontend/components/ui/cx";

export type TableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
};

type DataTableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
};

export function Table<T>({ columns, rows, rowKey, onRowClick }: DataTableProps<T>) {
  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-3 py-2 font-medium text-slate-600 ${column.align === "right" ? "text-right" : "text-left"}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={`hover:bg-slate-50 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => handleRowClick(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-2 ${column.align === "right" ? "text-right" : "text-left"}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 sm:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cx("space-y-1.5 py-3", onRowClick && "cursor-pointer")}
            onClick={() => handleRowClick(row)}
          >
            {columns.map((column, index) => (
              <div key={column.key} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="shrink-0 text-slate-500">{column.header}</span>
                <span className={index === 0 ? "font-medium text-slate-900" : "text-right text-slate-700"}>
                  {column.cell(row)}
                </span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
