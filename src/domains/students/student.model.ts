import type { Institution } from "@/domains/institutions/institution.model";
import { BaseModel } from "@/lib/db/baseModel";
import type { Row } from "@/lib/db/baseRepo";
import type { AppRepos } from "@/lib/db/repoRegistry";
import type { students } from "@/lib/db/schema";
import { StudentErrors } from "./student.errors";

export type StudentProps = Row<typeof students>;

export type StudentDeactivatePatch = {
  status: "inactive";
};

export interface Student extends Readonly<StudentProps> {}
export class Student extends BaseModel<typeof students> {
  constructor(row: StudentProps) {
    super(row);
  }

  isActive(): boolean {
    return this.status === "active";
  }

  fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  belongsTo(institution: Institution): boolean {
    return this.institutionId === institution.id;
  }

  /** Eligible for services: active, and enrolled in this institution while it isn't archived. */
  isEligible(institution: Institution): boolean {
    return this.isActive() && this.belongsTo(institution) && !institution.isArchived();
  }

  /** Replaces delete: students keep their (future clinical) history. */
  deactivate(): StudentDeactivatePatch {
    if (!this.isActive()) throw StudentErrors.alreadyInactive();
    return { status: "inactive" };
  }

  /** `null` only if the FK was violated, which the schema prevents. */
  institution(repos: Pick<AppRepos, "institutions">): Promise<Institution | null> {
    return repos.institutions.findById(this.institutionId);
  }
}
