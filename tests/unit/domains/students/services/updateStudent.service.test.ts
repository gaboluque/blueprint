import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { UpdateStudent } from "@/domains/students/services/updateStudent.service";
import { StudentErrors, STUDENT_ERROR_MESSAGES } from "@/domains/students/student.errors";
import { StudentPolicy } from "@/domains/students/student.policy";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import {
  buildAdminActor,
  buildArchivedInstitution,
  buildInstitution,
  buildStudent,
  INSTITUTION_ID,
  STUDENT_ID,
} from "../../../../factories/models";
import { StudentFakeRepos } from "./fakeRepos";

const PATCH = { lastName: "Renombrada" };

afterEach(() => jest.restoreAllMocks());

describe("UpdateStudent", () => {
  it("loads the student's institution and applies the patch", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    const updated = buildStudent(PATCH);
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildInstitution());
    students.update.mockResolvedValue(updated);

    const result = await UpdateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID, patch: PATCH });

    expect(institutions.findById).toHaveBeenCalledWith(INSTITUTION_ID);
    expect(students.update).toHaveBeenCalledWith(STUDENT_ID, PATCH);
    expect(result).toBe(updated);
  });

  it("throws not found when the student doesn't exist", async () => {
    const { repos, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(null);

    const act = UpdateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID, patch: PATCH });

    await expect(act).rejects.toThrow(NotFoundError);
    expect(students.update).not.toHaveBeenCalled();
  });

  it("throws not found when the student disappears before the update", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildInstitution());
    students.update.mockResolvedValue(null);

    const act = UpdateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID, patch: PATCH });

    await expect(act).rejects.toThrow(STUDENT_ERROR_MESSAGES.notFound);
  });

  it("rejects edits when the student's institution is archived", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildArchivedInstitution());

    const act = UpdateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID, patch: PATCH });

    await expect(act).rejects.toThrow(ConflictError);
    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.archived);
    expect(students.update).not.toHaveBeenCalled();
  });

  it("propagates the email conflict from the repo", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildInstitution());
    students.update.mockRejectedValue(StudentErrors.emailTaken());

    const act = UpdateStudent.call(repos, buildAdminActor(), {
      id: STUDENT_ID,
      patch: { email: "otra@ficticia.test" },
    });

    await expect(act).rejects.toThrow(STUDENT_ERROR_MESSAGES.emailTaken);
  });

  it("rejects a caller the policy denies without writing", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildInstitution());
    jest.spyOn(StudentPolicy, "canUpdate").mockReturnValue(false);

    const act = UpdateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID, patch: PATCH });

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(students.update).not.toHaveBeenCalled();
  });
});
