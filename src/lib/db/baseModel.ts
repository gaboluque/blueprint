import type { Row, TableWithId } from "./baseRepo";

/**
 * Domain entity backed by one Drizzle row.
 * Subclasses merge `Row<TTable>` via a same-name interface, exposing every column as a typed property.
 */
export abstract class BaseModel<TTable extends TableWithId> {
  protected constructor(row: Row<TTable>) {
    Object.assign(this, row);
  }
}
