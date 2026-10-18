import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  getTableName,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { ConflictError } from "@/lib/errors/domain.errors";
import { Pagination, type PaginationQuery, type PaginationResult } from "@/lib/pagination";
import type { DbExecutor } from "./client";
import { PgErrors } from "./pgErrors";

export type TableWithId = PgTable & { id: AnyPgColumn };
export type Row<T extends PgTable> = InferSelectModel<T>;
export type NewRow<T extends PgTable> = InferInsertModel<T>;
export type RowPatch<T extends PgTable> = Partial<Omit<NewRow<T>, "id" | "createdAt" | "updatedAt">>;
export type RowKey<T extends PgTable> = keyof Row<T> & string;

export type WhereOperators<V> = {
  eq?: V;
  neq?: V;
  in?: readonly V[];
  gt?: V;
  gte?: V;
  lt?: V;
  lte?: V;
  ilike?: string;
  isNull?: boolean;
};

/** Keyed by model property (camelCase). Scalar = eq (`null` = is null), array = in, object = operators, `undefined` = skipped. */
export type Where<T extends PgTable> = {
  [K in RowKey<T>]?: Row<T>[K] | readonly NonNullable<Row<T>[K]>[] | WhereOperators<NonNullable<Row<T>[K]>>;
};

export type OrderBy<T extends PgTable> = Partial<Record<RowKey<T>, "asc" | "desc">>;

export type FindOptions<T extends PgTable> = {
  orderBy?: OrderBy<T>;
  limit?: number;
  offset?: number;
};

/** Payload the base-repo decorator (and non-row callers) hand to the audit sink. */
export type AuditEntry = {
  entityType: string;
  verb: string;
  entityId: string;
  institutionId?: string | null;
  changes?: Record<string, unknown>;
};

/** Thin seam over the audit sink so BaseRepo doesn't depend on the audit domain. */
export type AuditSink = {
  record(entry: AuditEntry): Promise<unknown>;
};

/**
 * Injected by {@link RepoRegistry}: one Drizzle executor (connection or transaction) plus the audit sink.
 * Repos never call `Database.get()` themselves; always `new XxxRepo(context)` from the registry.
 */
export type RepoContext = {
  db: DbExecutor;
  audit: AuditSink;
};

const OPERATOR_KEYS = new Set(["eq", "neq", "in", "gt", "gte", "lt", "lte", "ilike", "isNull"]);

function isOperatorObject(value: unknown): value is WhereOperators<unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || value instanceof Date) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => OPERATOR_KEYS.has(key));
}

function operatorConditions(column: AnyPgColumn, operators: WhereOperators<unknown>): SQL[] {
  const conditions: SQL[] = [];
  if (operators.eq !== undefined) conditions.push(eq(column, operators.eq));
  if (operators.neq !== undefined) conditions.push(ne(column, operators.neq));
  if (operators.in !== undefined) conditions.push(inArray(column, [...operators.in]));
  if (operators.gt !== undefined) conditions.push(gt(column, operators.gt));
  if (operators.gte !== undefined) conditions.push(gte(column, operators.gte));
  if (operators.lt !== undefined) conditions.push(lt(column, operators.lt));
  if (operators.lte !== undefined) conditions.push(lte(column, operators.lte));
  if (operators.ilike !== undefined) conditions.push(ilike(column, operators.ilike));
  if (operators.isNull !== undefined) conditions.push(operators.isNull ? isNull(column) : isNotNull(column));
  return conditions;
}

/**
 * Generic CRUD over one Drizzle table; maps rows to models via `toModel`.
 * `create` and `update` auto-record an audit event via the shared sink unless `auditable` is false.
 * Subclasses add named queries only when a `where` object can't express them (joins, aggregates).
 * No hard delete: domains archive or deactivate rows instead.
 */
export abstract class BaseRepo<TTable extends TableWithId, TModel> {
  protected abstract readonly table: TTable;
  protected abstract toModel(row: Row<TTable>): TModel;
  /** Message for unique-constraint violations on insert/update. */
  protected readonly conflictMessage: string = "A record with those values already exists.";
  /** Set to `false` on `AuditEventsRepo` so audit writes don't recursively audit themselves. */
  protected readonly auditable: boolean = true;

  protected readonly db: DbExecutor;
  protected readonly audit: AuditSink;

  constructor(context: RepoContext) {
    this.db = context.db;
    this.audit = context.audit;
  }

  async find(where: Where<TTable> = {}, options: FindOptions<TTable> = {}): Promise<TModel[]> {
    let query = this.db
      .select()
      .from(this.table as PgTable)
      .where(this.whereSql(where))
      .orderBy(...this.orderSql(options.orderBy))
      .$dynamic();
    if (options.limit !== undefined) query = query.limit(options.limit);
    if (options.offset !== undefined) query = query.offset(options.offset);
    return this.toModels(await query);
  }

  async findBy(where: Where<TTable>, options: Pick<FindOptions<TTable>, "orderBy"> = {}): Promise<TModel | null> {
    const [model] = await this.find(where, { ...options, limit: 1 });
    return model ?? null;
  }

  async findById(id: string): Promise<TModel | null> {
    const rows = await this.db
      .select()
      .from(this.table as PgTable)
      .where(eq(this.table.id, id))
      .limit(1);
    return this.toModels(rows)[0] ?? null;
  }

  async count(where: Where<TTable> = {}): Promise<number> {
    return this.countWhere(this.whereSql(where));
  }

  async paginate(
    where: Where<TTable>,
    options: PaginationQuery & Pick<FindOptions<TTable>, "orderBy">,
  ): Promise<PaginationResult<TModel>> {
    const { page, pageSize } = options;
    const [items, total] = await Promise.all([
      this.find(where, { orderBy: options.orderBy, limit: pageSize, offset: Pagination.offsetOf(options) }),
      this.count(where),
    ]);
    return { items, page, pageSize, total };
  }

  async create(values: NewRow<TTable>): Promise<TModel> {
    const rows = await this.translateErrors(() =>
      this.db
        .insert(this.table)
        .values(values as TTable["$inferInsert"])
        .returning(),
    );
    const [row] = rows as Row<TTable>[];
    if (!row) throw new Error(`Insert into ${this.tableLabel()} returned no row`);
    await this.recordAudit("created", row, this.changesFor(values));
    return this.toModel(row);
  }

  /** Returns `null` when no row has that id. */
  async update(id: string, patch: RowPatch<TTable>): Promise<TModel | null> {
    const rows = await this.translateErrors(() =>
      this.db
        .update(this.table as PgTable)
        .set(patch)
        .where(eq(this.table.id, id))
        .returning(),
    );
    const [row] = rows as Row<TTable>[];
    if (!row) return null;
    await this.recordAudit("updated", row, this.changesFor(patch));
    return this.toModel(row);
  }

  /** Override when the row carries an `institutionId` (students) or _is_ the institution. */
  protected institutionIdOf(_row: Row<TTable>): string | null {
    return null;
  }

  /** Defaults to the table name minus a trailing `s` (`institutions` → `institution`). Override for irregular plurals. */
  protected entityType(): string {
    const name = getTableName(this.table);
    return name.endsWith("s") ? name.slice(0, -1) : name;
  }

  protected async countWhere(condition: SQL | undefined): Promise<number> {
    const [result] = await this.db
      .select({ total: count() })
      .from(this.table as PgTable)
      .where(condition);
    return result?.total ?? 0;
  }

  protected whereSql(where: Where<TTable>): SQL | undefined {
    const columns = getTableColumns(this.table) as Record<string, AnyPgColumn>;
    const conditions = Object.entries(where).flatMap(([key, value]): SQL[] => {
      if (value === undefined) return [];
      const column = this.columnOf(columns, key);
      if (value === null) return [isNull(column)];
      if (Array.isArray(value)) return [inArray(column, value)];
      if (isOperatorObject(value)) return operatorConditions(column, value);
      return [eq(column, value)];
    });
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /** Always appends `id` as a tiebreaker so pagination is deterministic. */
  protected orderSql(orderBy: OrderBy<TTable> = {}): SQL[] {
    const columns = getTableColumns(this.table) as Record<string, AnyPgColumn>;
    const clauses = Object.entries(orderBy).map(([key, direction]) => {
      const column = this.columnOf(columns, key);
      return direction === "desc" ? desc(column) : asc(column);
    });
    return [...clauses, asc(this.table.id)];
  }

  protected async translateErrors<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (PgErrors.isUniqueViolation(error)) throw new ConflictError(this.conflictMessage);
      throw error;
    }
  }

  protected toModels(rows: readonly unknown[]): TModel[] {
    return rows.map((row) => this.toModel(row as Row<TTable>));
  }

  private async recordAudit(
    verb: "created" | "updated",
    row: Row<TTable>,
    changes: Record<string, unknown>,
  ): Promise<void> {
    if (!this.auditable) return;
    const id = (row as { id: string }).id;
    await this.audit.record({
      entityType: this.entityType(),
      verb,
      entityId: id,
      institutionId: this.institutionIdOf(row),
      changes,
    });
  }

  /** Strips undefined and auto-managed fields so the stored diff is just what the caller sent. */
  private changesFor(input: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "id" || key === "createdAt" || key === "updatedAt") continue;
      out[key] = value;
    }
    return out;
  }

  private columnOf(columns: Record<string, AnyPgColumn>, key: string): AnyPgColumn {
    const column = columns[key];
    if (!column) throw new Error(`Unknown column "${key}" on ${this.tableLabel()}`);
    return column;
  }

  private tableLabel(): string {
    return this.constructor.name;
  }
}
