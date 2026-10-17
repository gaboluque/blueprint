import type { InstitutionsRepo } from "@/domains/institutions/institutions.repo";
import { STUDENT_ERROR_MESSAGES } from "@/domains/students/student.errors";
import { ConflictError } from "@/lib/errors/domain.errors";
import { buildArchivedInstitution, buildInstitution, buildStudent, INSTITUTION_ID } from "../../../factories/models";

const OTHER_INSTITUTION_ID = "44444444-4444-4444-8444-444444444444";

describe("Student", () => {
  describe("isActive", () => {
    it("is true for an active student", () => {
      expect(buildStudent().isActive()).toBe(true);
    });

    it("is false for an inactive student", () => {
      expect(buildStudent({ status: "inactive" }).isActive()).toBe(false);
    });
  });

  describe("fullName", () => {
    it("joins first and last name", () => {
      expect(buildStudent({ firstName: "Ana", lastName: "Prueba" }).fullName()).toBe("Ana Prueba");
    });
  });

  describe("isEligible", () => {
    it("is true when active and enrolled in an active institution", () => {
      expect(buildStudent().isEligible(buildInstitution())).toBe(true);
    });

    it("is false when the student is inactive", () => {
      expect(buildStudent({ status: "inactive" }).isEligible(buildInstitution())).toBe(false);
    });

    it("is false when the institution is archived", () => {
      expect(buildStudent().isEligible(buildArchivedInstitution())).toBe(false);
    });

    it("is false for an institution the student doesn't belong to", () => {
      const otherInstitution = buildInstitution({ id: OTHER_INSTITUTION_ID });

      expect(buildStudent().isEligible(otherInstitution)).toBe(false);
    });
  });

  describe("deactivate", () => {
    it("returns the inactive status patch for an active student", () => {
      expect(buildStudent().deactivate()).toEqual({ status: "inactive" });
    });

    it("throws a conflict when the student is already inactive", () => {
      const act = () => buildStudent({ status: "inactive" }).deactivate();

      expect(act).toThrow(ConflictError);
      expect(act).toThrow(STUDENT_ERROR_MESSAGES.alreadyInactive);
    });
  });

  describe("institution", () => {
    it("loads its own institution through the repo", async () => {
      const institution = buildInstitution();
      const findById = jest.fn().mockResolvedValue(institution);
      const repos = { institutions: { findById } as unknown as InstitutionsRepo };

      const result = await buildStudent().institution(repos);

      expect(findById).toHaveBeenCalledWith(INSTITUTION_ID);
      expect(result).toBe(institution);
    });
  });
});
