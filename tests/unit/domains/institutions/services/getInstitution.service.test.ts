import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { GetInstitution } from "@/domains/institutions/services/getInstitution.service";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import { buildAdminActor, buildArchivedInstitution, buildInstitution, INSTITUTION_ID } from "../../../../factories/models";

function setup() {
  const findById = jest.fn();
  const repos = { institutions: { findById } } as unknown as AppRepos;
  return { repos, findById };
}

afterEach(() => jest.restoreAllMocks());

describe("GetInstitution", () => {
  it("returns the institution by id", async () => {
    const { repos, findById } = setup();
    const institution = buildInstitution();
    findById.mockResolvedValue(institution);

    const result = await GetInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    expect(findById).toHaveBeenCalledWith(INSTITUTION_ID);
    expect(result).toBe(institution);
  });

  it("returns archived institutions too", async () => {
    const { repos, findById } = setup();
    const institution = buildArchivedInstitution();
    findById.mockResolvedValue(institution);

    const result = await GetInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    expect(result).toBe(institution);
  });

  it("throws not found when the institution doesn't exist", async () => {
    const { repos, findById } = setup();
    findById.mockResolvedValue(null);

    const act = GetInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    await expect(act).rejects.toThrow(NotFoundError);
    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.notFound);
  });

  it("rejects a caller the policy denies", async () => {
    const { repos, findById } = setup();
    findById.mockResolvedValue(buildInstitution());
    jest.spyOn(InstitutionPolicy, "canRead").mockReturnValue(false);

    const act = GetInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    await expect(act).rejects.toThrow(ForbiddenError);
  });
});
