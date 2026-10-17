import type { StudentsRepo } from "@/domains/students/students.repo";
import { INSTITUTION_ERROR_MESSAGES } from "@/domains/institutions/institution.errors";
import { ConflictError } from "@/lib/errors/domain.errors";
import { buildArchivedInstitution, buildInstitution, buildStudent, INSTITUTION_ID } from "../../../factories/models";

describe("Institution", () => {
  describe("isArchived", () => {
    it("is false for an active institution", () => {
      expect(buildInstitution().isArchived()).toBe(false);
    });

    it("is true for an archived institution", () => {
      expect(buildArchivedInstitution().isArchived()).toBe(true);
    });
  });

  describe("assertEditable", () => {
    it("allows edits while active", () => {
      expect(() => buildInstitution().assertEditable()).not.toThrow();
    });

    it("rejects edits once archived with a conflict", () => {
      const institution = buildArchivedInstitution();

      const act = () => institution.assertEditable();

      expect(act).toThrow(ConflictError);
      expect(act).toThrow(INSTITUTION_ERROR_MESSAGES.archived);
    });
  });

  describe("archive", () => {
    it("returns the archived status stamped with the given time", () => {
      const now = new Date("2026-03-01T12:00:00.000Z");

      const patch = buildInstitution().archive(now);

      expect(patch).toEqual({ status: "archived", archivedAt: now });
    });

    it("rejects archiving twice", () => {
      const institution = buildArchivedInstitution();

      const act = () => institution.archive(new Date());

      expect(act).toThrow(INSTITUTION_ERROR_MESSAGES.alreadyArchived);
    });
  });

  describe("students", () => {
    it("loads one page of its own students through the repo", async () => {
      const page = { items: [buildStudent()], page: 2, pageSize: 10, total: 11 };
      const listByInstitution = jest.fn().mockResolvedValue(page);
      const repos = { students: { listByInstitution } as unknown as StudentsRepo };

      const result = await buildInstitution().students(repos, { page: 2, pageSize: 10 }, { status: "active" });

      expect(listByInstitution).toHaveBeenCalledWith(INSTITUTION_ID, { status: "active" }, { page: 2, pageSize: 10 });
      expect(result).toBe(page);
    });
  });
});
