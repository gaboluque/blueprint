import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { BaseRepo, type Row } from "@/lib/db/baseRepo";
import { students, type StudentStatus } from "@/lib/db/schema";
import { SqlHelpers } from "@/lib/db/sqlHelpers";
import { Pagination, type PaginationQuery, type PaginationResult } from "@/lib/pagination";
import { STUDENT_ERROR_MESSAGES } from "./student.errors";
import { Student } from "./student.model";

export type StudentListFilters = {
  /** Matches first name, last name, email, or document id, case-insensitive. */
  search?: string;
  status?: StudentStatus;
};

export class StudentsRepo extends BaseRepo<typeof students, Student> {
  protected readonly table = students;
  protected override readonly conflictMessage = STUDENT_ERROR_MESSAGES.emailTaken;

  protected toModel(row: Row<typeof students>): Student {
    return new Student(row);
  }

  protected override institutionIdOf(row: Row<typeof students>): string {
    return row.institutionId;
  }

  findByEmail(email: string): Promise<Student | null> {
    return this.findBy({ email: email.toLowerCase() });
  }

  /** Sorted by last name, then first name. */
  async listByInstitution(
    institutionId: string,
    filters: StudentListFilters,
    page: PaginationQuery,
  ): Promise<PaginationResult<Student>> {
    const condition = this.listCondition(institutionId, filters);
    const [rows, total] = await Promise.all([
      this.db
        .select()
        .from(students)
        .where(condition)
        .orderBy(...this.orderSql({ lastName: "asc", firstName: "asc" }))
        .limit(page.pageSize)
        .offset(Pagination.offsetOf(page)),
      this.countWhere(condition),
    ]);
    return { items: this.toModels(rows), page: page.page, pageSize: page.pageSize, total };
  }

  private listCondition(institutionId: string, { search, status }: StudentListFilters): SQL | undefined {
    const conditions: (SQL | undefined)[] = [
      eq(students.institutionId, institutionId),
      status ? eq(students.status, status) : undefined,
    ];
    if (search) {
      const pattern = SqlHelpers.containsPattern(search);
      conditions.push(
        or(
          ilike(students.firstName, pattern),
          ilike(students.lastName, pattern),
          ilike(students.email, pattern),
          ilike(students.documentId, pattern),
        ),
      );
    }
    return and(...conditions);
  }
}
