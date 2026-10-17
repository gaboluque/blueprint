import { InstitutionsRepo } from "@/domains/institutions/institutions.repo";
import { StudentsRepo } from "@/domains/students/students.repo";
import { UsersRepo } from "@/domains/users/users.repo";
import type { DbExecutor } from "./client";

export type AppRepos = {
  users: UsersRepo;
  institutions: InstitutionsRepo;
  students: StudentsRepo;
};

/** Built per request from the root db or a `tx`. Register new table repos here. */
export class RepoRegistry {
  readonly repos: AppRepos;

  constructor(private readonly db: DbExecutor) {
    this.repos = {
      users: new UsersRepo(db),
      institutions: new InstitutionsRepo(db),
      students: new StudentsRepo(db),
    };
  }

  /** Runs `work` with repos bound to one transaction; rolls back if it throws. */
  transaction<T>(work: (repos: AppRepos) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => work(new RepoRegistry(tx).repos));
  }
}
