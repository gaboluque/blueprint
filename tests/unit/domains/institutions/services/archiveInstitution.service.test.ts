import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { ArchiveInstitution } from "@/domains/institutions/services/archiveInstitution.service";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import { buildAdminActor, buildArchivedInstitution, buildInstitution, INSTITUTION_ID } from "../../../../factories/models";

const NOW = new Date("2026-03-01T12:00:00.000Z");

function setup() {
  const findById = jest.fn();
  const update = jest.fn();
  const repos = { institutions: { findById, update } } as unknown as AppRepos;
  return { repos, findById, update };
}

beforeEach(() => jest.useFakeTimers({ now: NOW }));

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("ArchiveInstitution", () => {
  it("archives the institution stamped with the current time", async () => {
    const { repos, findById, update } = setup();
    const archived = buildArchivedInstitution({ archivedAt: NOW });
    findById.mockResolvedValue(buildInstitution());
    update.mockResolvedValue(archived);

    const result = await ArchiveInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    expect(update).toHaveBeenCalledWith(INSTITUTION_ID, { status: "archived", archivedAt: NOW });
    expect(result).toBe(archived);
  });

  it("throws not found when the institution doesn't exist", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(null);

    const act = ArchiveInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    await expect(act).rejects.toThrow(NotFoundError);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects archiving an already archived institution with a conflict", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(buildArchivedInstitution());

    const act = ArchiveInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    await expect(act).rejects.toThrow(ConflictError);
    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.alreadyArchived);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a caller the policy denies without writing", async () => {
    const { repos, findById, update } = setup();
    findById.mockResolvedValue(buildInstitution());
    jest.spyOn(InstitutionPolicy, "canArchive").mockReturnValue(false);

    const act = ArchiveInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID });

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(update).not.toHaveBeenCalled();
  });
});
