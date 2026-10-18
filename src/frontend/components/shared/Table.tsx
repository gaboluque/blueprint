import type { ReactNode } from "react";

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
    <div className="overflow-x-auto">
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
  );
}
