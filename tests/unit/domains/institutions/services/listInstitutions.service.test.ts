import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { ListInstitutions } from "@/domains/institutions/services/listInstitutions.service";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { ForbiddenError } from "@/lib/errors/domain.errors";
import { buildAdminActor, buildInstitution } from "../../../../factories/models";

function setup() {
  const listWithStudentCounts = jest.fn();
  const repos = { institutions: { listWithStudentCounts } } as unknown as AppRepos;
  return { repos, listWithStudentCounts };
}

afterEach(() => jest.restoreAllMocks());

describe("ListInstitutions", () => {
  it("returns one page of institutions with their student counts, passing filters and paging apart", async () => {
    const { repos, listWithStudentCounts } = setup();
    const page = { items: [{ institution: buildInstitution(), studentCount: 3 }], page: 2, pageSize: 10, total: 11 };
    listWithStudentCounts.mockResolvedValue(page);

    const result = await ListInstitutions.call(repos, buildAdminActor(), {
      page: 2,
      pageSize: 10,
      search: "ficticia",
      status: "active",
    });

    expect(listWithStudentCounts).toHaveBeenCalledWith({ search: "ficticia", status: "active" }, { page: 2, pageSize: 10 });
    expect(result).toBe(page);
  });

  it("rejects a caller the policy denies without querying", async () => {
    const { repos, listWithStudentCounts } = setup();
    jest.spyOn(InstitutionPolicy, "canList").mockReturnValue(false);

    const act = ListInstitutions.call(repos, buildAdminActor(), { page: 1, pageSize: 20, search: undefined });

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(listWithStudentCounts).not.toHaveBeenCalled();
  });
});
