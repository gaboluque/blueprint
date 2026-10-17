import type { StudentStatus } from "@/lib/db/schema";
import type { AppRepos } from "@/lib/db/repoRegistry";
import type { Institution } from "@/domains/institutions/institution.model";
import { StudentErrors } from "./student.errors";

export type StudentDeactivatePatch = {
  status: "inactive";
};

export type StudentProps = {
  id: string;
  institutionId: string;
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  status: StudentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class Student {
  readonly id: string;
  readonly institutionId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly documentId: string;
  readonly status: StudentStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: StudentProps) {
    this.id = props.id;
    this.institutionId = props.institutionId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.documentId = props.documentId;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
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
