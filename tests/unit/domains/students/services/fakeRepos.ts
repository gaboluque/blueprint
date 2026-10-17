import type { AppRepos } from "@/lib/db/repoRegistry";

/** Repo fakes for student services; each method is a bare `jest.fn()`. */
function build() {
  const institutions = { findById: jest.fn() };
  const students = { findById: jest.fn(), create: jest.fn(), update: jest.fn(), listByInstitution: jest.fn() };
  const repos = { institutions, students } as unknown as AppRepos;
  return { repos, institutions, students };
}

export const StudentFakeRepos = { build };
