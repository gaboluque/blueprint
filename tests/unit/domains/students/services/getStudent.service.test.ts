import { GetStudent } from "@/domains/students/services/getStudent.service";
import { STUDENT_ERROR_MESSAGES } from "@/domains/students/student.errors";
import { StudentPolicy } from "@/domains/students/student.policy";
import { ForbiddenError, NotFoundError } from "@/lib/errors/domain.errors";
import { buildAdminActor, buildStudent, STUDENT_ID } from "../../../../factories/models";
import { StudentFakeRepos } from "./fakeRepos";

afterEach(() => jest.restoreAllMocks());

describe("GetStudent", () => {
  it("returns the student, inactive ones included", async () => {
    const { repos, students } = StudentFakeRepos.build();
    const student = buildStudent({ status: "inactive" });
    students.findById.mockResolvedValue(student);

    const result = await GetStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    expect(students.findById).toHaveBeenCalledWith(STUDENT_ID);
    expect(result).toBe(student);
  });

  it("throws not found when the student doesn't exist", async () => {
    const { repos, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(null);

    const act = GetStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    await expect(act).rejects.toThrow(NotFoundError);
    await expect(act).rejects.toThrow(STUDENT_ERROR_MESSAGES.notFound);
  });

  it("rejects a caller the policy denies", async () => {
    const { repos, students } = StudentFakeRepos.build();
    students.findById.mockResolvedValue(buildStudent());
    jest.spyOn(StudentPolicy, "canRead").mockReturnValue(false);

    const act = GetStudent.call(repos, buildAdminActor(), { id: STUDENT_ID });

    await expect(act).rejects.toThrow(ForbiddenError);
  });
});
