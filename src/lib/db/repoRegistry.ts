import { AuditEventsRepo, type AuditContext } from "@/domains/audit/auditEvents.repo";
import { InstitutionMembersRepo } from "@/domains/institutionMembers/institutionMembers.repo";
import { InstitutionsRepo } from "@/domains/institutions/institutions.repo";
import { StudentsRepo } from "@/domains/students/students.repo";
import { UsersRepo } from "@/domains/users/users.repo";
import type { AuditSink, RepoContext } from "./baseRepo";
import type { DbExecutor } from "./client";

export type AppRepos = {
  users: UsersRepo;
  institutionMembers: InstitutionMembersRepo;
  institutions: InstitutionsRepo;
  students: StudentsRepo;
  audit: AuditEventsRepo;
};

/** Built per request from the root db or a `tx`. Register new table repos here. */
export class RepoRegistry {
  readonly repos: AppRepos;
  private auditContext: AuditContext | null;

  constructor(private readonly db: DbExecutor, auditContext: AuditContext | null = null) {
    this.auditContext = auditContext;
    const auditRepo = this.buildAuditRepo();
    const sink: AuditSink = { record: (entry) => auditRepo.record(entry) };
    const context: RepoContext = { db, audit: sink };
    this.repos = {
      users: new UsersRepo(context),
      institutionMembers: new InstitutionMembersRepo(context),
      institutions: new InstitutionsRepo(context),
      students: new StudentsRepo(context),
      audit: auditRepo,
    };
  }

  /** Called by the api handler after auth so mutations inside the request know who did them. */
  setAuditContext(context: AuditContext): void {
    this.auditContext = context;
  }

  /** Runs `work` with repos bound to one transaction; rolls back if it throws. */
  transaction<T>(work: (repos: AppRepos) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => work(new RepoRegistry(tx, this.auditContext).repos));
  }

  private buildAuditRepo(): AuditEventsRepo {
    // Lazy getter so the context captured here is always the registry's current one
    // (route handlers set it after the registry is built).
    const stubSink: AuditSink = { record: async () => undefined };
    return new AuditEventsRepo({ db: this.db, audit: stubSink }, () => this.auditContext);
  }
}
