import type { Student } from "@/domains/students/student.model";
import type { StudentListFilters } from "@/domains/students/students.repo";
import { BaseModel } from "@/lib/db/baseModel";
import type { Row } from "@/lib/db/baseRepo";
import type { AppRepos } from "@/lib/db/repoRegistry";
import type { institutions } from "@/lib/db/schema";
import type { PaginationQuery, PaginationResult } from "@/lib/pagination";
import { InstitutionErrors } from "./institution.errors";

export type InstitutionProps = Row<typeof institutions>;

export type InstitutionArchivePatch = {
  status: "archived";
  archivedAt: Date;
};

export interface Institution extends Readonly<InstitutionProps> {}
export class Institution extends BaseModel<typeof institutions> {
  constructor(row: InstitutionProps) {
    super(row);
  }

  isArchived(): boolean {
    return this.status === "archived";
  }

  /** Archived institutions are read-only: no edits, no new students. */
  assertEditable(): void {
    if (this.isArchived()) throw InstitutionErrors.archived();
  }

  /** Archive replaces delete; students are kept. `now` is injected so the model never reads the clock. */
  archive(now: Date): InstitutionArchivePatch {
    if (this.isArchived()) throw InstitutionErrors.alreadyArchived();
    return { status: "archived", archivedAt: now };
  }

  students(
    repos: Pick<AppRepos, "students">,
    page: PaginationQuery,
    filters: StudentListFilters = {},
  ): Promise<PaginationResult<Student>> {
    return repos.students.listByInstitution(this.id, filters, page);
  }
}
