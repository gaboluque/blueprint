import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { CreateInstitution } from "@/domains/institutions/services/createInstitution.service";
import type { AppRepos } from "@/lib/db/repoRegistry";
import { ConflictError, ForbiddenError } from "@/lib/errors/domain.errors";
import { buildAdminActor, buildInstitution } from "../../../../factories/models";

const INPUT = { name: "Universidad Ficticia", contactEmail: "bienestar@ficticia.test" };

function setup() {
  const create = jest.fn();
  const repos = { institutions: { create } } as unknown as AppRepos;
  return { repos, create };
}

afterEach(() => jest.restoreAllMocks());

describe("CreateInstitution", () => {
  it("creates the institution from the given fields", async () => {
    const { repos, create } = setup();
    const institution = buildInstitution();
    create.mockResolvedValue(institution);

    const result = await CreateInstitution.call(repos, buildAdminActor(), INPUT);

    expect(create).toHaveBeenCalledWith(INPUT);
    expect(result).toBe(institution);
  });

  it("propagates a conflict from the repo", async () => {
    const { repos, create } = setup();
    create.mockRejectedValue(new ConflictError("A record with those values already exists."));

    const act = CreateInstitution.call(repos, buildAdminActor(), INPUT);

    await expect(act).rejects.toThrow("A record with those values already exists.");
  });

  it("rejects a caller the policy denies without writing", async () => {
    const { repos, create } = setup();
    jest.spyOn(InstitutionPolicy, "canCreate").mockReturnValue(false);

    const act = CreateInstitution.call(repos, buildAdminActor(), INPUT);

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(create).not.toHaveBeenCalled();
  });
});
