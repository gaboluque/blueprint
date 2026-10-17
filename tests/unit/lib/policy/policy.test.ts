import { ForbiddenError } from "@/lib/errors/domain.errors";
import { Policy } from "@/lib/policy/policy";
import { buildAdminActor } from "../../../factories/models";

describe("Policy", () => {
  describe("isAdmin", () => {
    it("is true for an admin actor", () => {
      expect(Policy.isAdmin(buildAdminActor())).toBe(true);
    });

    it("fails closed without an actor", () => {
      expect(Policy.isAdmin(null)).toBe(false);
      expect(Policy.isAdmin(undefined)).toBe(false);
    });
  });

  describe("authorize", () => {
    it("passes when allowed", () => {
      expect(() => Policy.authorize(true)).not.toThrow();
    });

    it("throws a forbidden error with the given message when denied", () => {
      const act = () => Policy.authorize(false, "No puedes ver esta institución.");

      expect(act).toThrow(ForbiddenError);
      expect(act).toThrow("No puedes ver esta institución.");
    });
  });
});
