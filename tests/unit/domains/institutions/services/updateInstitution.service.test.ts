import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { UpdateInstitution } from "@/domains/institutions/services/updateInstitution.service";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import { buildAdminActor, buildArchivedInstitution, buildInstitution, INSTITUTION_ID } from "../../../../factories/models";

const PATCH = { name: "Universidad Renombrada" };

function setup() {
  const findById = jest.fn();
  const update = jest.fn();
  const repos = { institutions: { findById, update } } as unknown as AppRepos;
  return { repos, findById, update };
}

afterEach(() => jest.restoreAllMocks());

describe("UpdateInstitution", () => {
  it("applies the patch and returns the updated institution", async () => {
    const { repos, findById, update } = setup();
    const updated = buildInstitution(PATCH);
    findById.mockResolvedValue(buildInstitution());
    update.mockResolvedValue(updated);

    const result = await UpdateInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID, patch: PATCH });

    expect(update).toHaveBeenCalledWith(INSTITUTION_ID, PATCH);
    expect(result).toBe(updated);
  });

  it("throws not found when the institution doesn't exist", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(null);

    const act = UpdateInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID, patch: PATCH });

    await expect(act).rejects.toThrow(NotFoundError);
    expect(update).not.toHaveBeenCalled();
  });

  it("throws not found when the institution disappears before the update", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(buildInstitution());
    update.mockResolvedValue(null);

    const act = UpdateInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID, patch: PATCH });

    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.notFound);
  });

  it("rejects edits to an archived institution with a conflict", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(buildArchivedInstitution());

    const act = UpdateInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID, patch: PATCH });

    await expect(act).rejects.toThrow(ConflictError);
    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.archived);
    expect(update).not.toHaveBeenCalled();
  });

  it("propagates the slug conflict from the repo", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(buildInstitution());
    update.mockRejectedValue(new ConflictError(INSTITUTION_ERROR_MESSAGES.slugTaken));

    const act = UpdateInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID, patch: { slug: "u-otra" } });

    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.slugTaken);
  });

  it("rejects a caller the policy denies without writing", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(buildInstitution());
    jest.spyOn(InstitutionPolicy, "canUpdate").mockReturnValue(false);

    const act = UpdateInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID, patch: PATCH });

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(update).not.toHaveBeenCalled();
  });
});
