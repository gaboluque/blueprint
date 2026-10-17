import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { InstitutionPolicy } from "@/domains/institutions/institution.policy";
import { CreateStudent } from "@/domains/students/services/createStudent.service";
import { StudentErrors, STUDENT_ERROR_MESSAGES } from "@/domains/students/student.errors";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import {
  buildAdminActor,
  buildArchivedInstitution,
  buildInstitution,
  buildStudent,
  INSTITUTION_ID,
} from "../../../../factories/models";
import { StudentFakeRepos } from "./fakeRepos";

const BODY = {
  firstName: "Ana",
  lastName: "Prueba",
  email: "ana.prueba@ficticia.test",
  documentId: "1000000001",
  status: "active" as const,
};

afterEach(() => jest.restoreAllMocks());

describe("CreateStudent", () => {
  it("creates the student in the institution from the path", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    const created = buildStudent();
    institutions.findById.mockResolvedValue(buildInstitution());
    students.create.mockResolvedValue(created);

    const result = await CreateStudent.call(repos, buildAdminActor(), { institutionId: INSTITUTION_ID, body: BODY });

    expect(students.create).toHaveBeenCalledWith({ ...BODY, institutionId: INSTITUTION_ID });
    expect(result).toBe(created);
  });

  it("throws not found when the institution doesn't exist", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    institutions.findById.mockResolvedValue(null);

    const act = CreateStudent.call(repos, buildAdminActor(), { institutionId: INSTITUTION_ID, body: BODY });

    await expect(act).rejects.toThrow(NotFoundError);
    expect(students.create).not.toHaveBeenCalled();
  });

  it("rejects new students in an archived institution with a conflict", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    institutions.findById.mockResolvedValue(buildArchivedInstitution());

    const act = CreateStudent.call(repos, buildAdminActor(), { institutionId: INSTITUTION_ID, body: BODY });

    await expect(act).rejects.toThrow(ConflictError);
    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.archived);
    expect(students.create).not.toHaveBeenCalled();
  });

  it("propagates the email conflict from the repo", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    institutions.findById.mockResolvedValue(buildInstitution());
    students.create.mockRejectedValue(StudentErrors.emailTaken());

    const act = CreateStudent.call(repos, buildAdminActor(), { institutionId: INSTITUTION_ID, body: BODY });

    await expect(act).rejects.toThrow(STUDENT_ERROR_MESSAGES.emailTaken);
  });

  it("rejects a caller the policy denies without writing", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    institutions.findById.mockResolvedValue(buildInstitution());
    jest.spyOn(InstitutionPolicy, "canManageStudents").mockReturnValue(false);

    const act = CreateStudent.call(repos, buildAdminActor(), { institutionId: INSTITUTION_ID, body: BODY });

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(students.create).not.toHaveBeenCalled();
  });
});
