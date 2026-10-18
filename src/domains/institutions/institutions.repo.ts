import { and, eq, getTableColumns, ilike, sql, type SQL } from "drizzle-orm";
import { BaseRepo, type Row } from "@/lib/db/baseRepo";
import { institutions, students, type InstitutionStatus } from "@/lib/db/schema";
import { SqlHelpers } from "@/lib/db/sqlHelpers";
import { Pagination, type PaginationQuery, type PaginationResult } from "@/lib/pagination";
import { Institution } from "./institution.model";

export type InstitutionListFilters = {
  /** Matches name, case-insensitive. */
  search?: string;
  status?: InstitutionStatus;
};

export type InstitutionWithStudentCount = {
  institution: Institution;
  studentCount: number;
};

export class InstitutionsRepo extends BaseRepo<typeof institutions, Institution> {
  protected readonly table = institutions;

  protected toModel(row: Row<typeof institutions>): Institution {
    return new Institution(row);
  }

  protected override institutionIdOf(row: Row<typeof institutions>): string {
    return row.id;
  }

  /** Newest first, each with its total student count (all statuses). */
  async listWithStudentCounts(
    filters: InstitutionListFilters,
    page: PaginationQuery,
  ): Promise<PaginationResult<InstitutionWithStudentCount>> {
    const condition = this.listCondition(filters);
    // Qualified by hand: single-table selects render columns unqualified, so `id` would bind to students.id.
    const studentCount = sql<number>`(
      select count(*) from ${students}
      where ${students}.${sql.identifier(students.institutionId.name)} = ${institutions}.${sql.identifier(institutions.id.name)}
    )`.mapWith(Number);

    const [rows, total] = await Promise.all([
      this.db
        .select({ ...getTableColumns(institutions), studentCount })
        .from(institutions)
        .where(condition)
        .orderBy(...this.orderSql({ createdAt: "desc" }))
        .limit(page.pageSize)
        .offset(Pagination.offsetOf(page)),
      this.countWhere(condition),
    ]);

    return {
      items: rows.map(({ studentCount: count, ...row }) => ({
        institution: this.toModel(row),
        studentCount: count,
      })),
      page: page.page,
      pageSize: page.pageSize,
      total,
    };
  }

  private listCondition({ search, status }: InstitutionListFilters): SQL | undefined {
    const conditions: (SQL | undefined)[] = [status ? eq(institutions.status, status) : undefined];
    if (search) {
      const pattern = SqlHelpers.containsPattern(search);
      conditions.push(ilike(institutions.name, pattern));
    }
    return and(...conditions);
  }
}
