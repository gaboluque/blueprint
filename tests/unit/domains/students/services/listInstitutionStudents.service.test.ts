import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { ListInstitutionStudents } from "@/domains/students/services/listInstitutionStudents.service";
import { ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import {
  buildAdminActor,
  buildArchivedInstitution,
  buildInstitution,
  buildStudent,
  INSTITUTION_ID,
} from "../../../../factories/models";
import { StudentFakeRepos } from "./fakeRepos";

const QUERY = { page: 2, pageSize: 10, search: "ana", status: "active" as const };

afterEach(() => jest.restoreAllMocks());

describe("ListInstitutionStudents", () => {
  it("returns the institution's students page with the given filters", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    const page = { items: [buildStudent()], page: 2, pageSize: 10, total: 11 };
    institutions.findById.mockResolvedValue(buildInstitution());
    students.listByInstitution.mockResolvedValue(page);

    const result = await ListInstitutionStudents.call(repos, buildAdminActor(), {
      institutionId: INSTITUTION_ID,
      query: QUERY,
    });

    expect(students.listByInstitution).toHaveBeenCalledWith(
      INSTITUTION_ID,
      { search: "ana", status: "active" },
      { page: 2, pageSize: 10 },
    );
    expect(result).toBe(page);
  });

  it("still lists the students of an archived institution", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    institutions.findById.mockResolvedValue(buildArchivedInstitution());
    students.listByInstitution.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });

    const result = await ListInstitutionStudents.call(repos, buildAdminActor(), {
      institutionId: INSTITUTION_ID,
      query: { page: 1, pageSize: 20, search: undefined },
    });

    expect(result.total).toBe(0);
  });

  it("throws not found when the institution doesn't exist", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    institutions.findById.mockResolvedValue(null);

    const act = ListInstitutionStudents.call(repos, buildAdminActor(), { institutionId: INSTITUTION_ID, query: QUERY });

    await expect(act).rejects.toThrow(NotFoundError);
    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.notFound);
    expect(students.listByInstitution).not.toHaveBeenCalled();
  });

  it("rejects a caller the policy denies without listing", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    institutions.findById.mockResolvedValue(buildInstitution());
    jest.spyOn(InstitutionPolicy, "canRead").mockReturnValue(false);

    const act = ListInstitutionStudents.call(repos, buildAdminActor(), { institutionId: INSTITUTION_ID, query: QUERY });

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(students.listByInstitution).not.toHaveBeenCalled();
  });
});
