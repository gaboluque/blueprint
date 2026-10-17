import type { InstitutionStatus } from "@/lib/db/schema";
import type { PaginationQuery, PaginationResult } from "@/lib/pagination";
import type { AppRepos } from "@/lib/db/repoRegistry";
import type { StudentListFilters } from "@/domains/students/students.repo";
import type { Student } from "@/domains/students/student.model";
import { InstitutionErrors } from "./institution.errors";

export type InstitutionProps = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  status: InstitutionStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InstitutionArchivePatch = {
  status: "archived";
  archivedAt: Date;
};

export class Institution {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly contactEmail: string;
  readonly status: InstitutionStatus;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: InstitutionProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.contactEmail = props.contactEmail;
    this.status = props.status;
    this.archivedAt = props.archivedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
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
