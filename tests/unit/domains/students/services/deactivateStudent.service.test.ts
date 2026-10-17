import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { DeactivateStudent } from "@/domains/students/services/deactivateStudent.service";
import { STUDENT_ERROR_MESSAGES } from "@/domains/students/student.errors";
import { StudentPolicy } from "@/domains/students/student.policy";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import {
  buildAdminActor,
  buildArchivedInstitution,
  buildInstitution,
  buildStudent,
  STUDENT_ID,
} from "../../../../factories/models";
import { StudentFakeRepos } from "./fakeRepos";

afterEach(() => jest.restoreAllMocks());

describe("DeactivateStudent", () => {
  it("sets the student inactive instead of deleting it", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    const deactivated = buildStudent({ status: "inactive" });
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildInstitution());
    students.update.mockResolvedValue(deactivated);

    const result = await DeactivateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    expect(students.update).toHaveBeenCalledWith(STUDENT_ID, { status: "inactive" });
    expect(result).toBe(deactivated);
  });

  it("throws not found when the student doesn't exist", async () => {
    const { repos, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(null);

    const act = DeactivateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    await expect(act).rejects.toThrow(NotFoundError);
    expect(students.update).not.toHaveBeenCalled();
  });

  it("throws not found when the student disappears before the update", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildInstitution());
    students.update.mockResolvedValue(null);

    const act = DeactivateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    await expect(act).rejects.toThrow(STUDENT_ERROR_MESSAGES.notFound);
  });

  it("rejects an already inactive student with a conflict", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent({ status: "inactive" }));
    institutions.findById.mockResolvedValue(buildInstitution());

    const act = DeactivateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    await expect(act).rejects.toThrow(ConflictError);
    await expect(act).rejects.toThrow(STUDENT_ERROR_MESSAGES.alreadyInactive);
    expect(students.update).not.toHaveBeenCalled();
  });

  it("rejects deactivation when the student's institution is archived", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildArchivedInstitution());

    const act = DeactivateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    await expect(act).rejects.toThrow(INSTITUTION_ERROR_MESSAGES.archived);
    expect(students.update).not.toHaveBeenCalled();
  });

  it("rejects a caller the policy denies without writing", async () => {
    const { repos, institutions, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    institutions.findById.mockResolvedValue(buildInstitution());
    jest.spyOn(StudentPolicy, "canDeactivate").mockReturnValue(false);

    const act = DeactivateStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    await expect(act).rejects.toThrow(ForbiddenError);
    expect(students.update).not.toHaveBeenCalled();
  });
});
