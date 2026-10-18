import { AdminPageAccess } from "@/app/(client)/admin/_lib/adminPageAccess";
import { buildAdminActor, buildInstitutionStaffActor } from "../../../factories/models";

describe("AdminPageAccess.decide", () => {
  it("sends signed-out visitors to login", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/institutions", hasSessionCookie: false, actor: null });

    expect(decision).toEqual({ redirectTo: "/admin/login", clearSessionCookie: false });
  });

  it("lets signed-out visitors stay on login", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/login", hasSessionCookie: false, actor: null });

    expect(decision).toEqual({ redirectTo: null, clearSessionCookie: false });
  });

  it("sends signed-in admins from login to the panel home", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin", hasSessionCookie: true, actor: buildAdminActor() });

    expect(decision).toEqual({ redirectTo: null, clearSessionCookie: false });
  });

  it("sends signed-in admins away from login", () => {
    const decision = AdminPageAccess.decide({
      pathname: "/admin/login",
      hasSessionCookie: true,
      actor: buildAdminActor(),
    });

    expect(decision).toEqual({ redirectTo: "/admin", clearSessionCookie: false });
  });

  it("treats a garbage cookie as signed out and clears it", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/institutions", hasSessionCookie: true, actor: null });

    expect(decision).toEqual({ redirectTo: "/admin/login", clearSessionCookie: true });
  });

  it("keeps garbage-cookie visitors on login without clearing again", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/login", hasSessionCookie: true, actor: null });

    expect(decision).toEqual({ redirectTo: null, clearSessionCookie: true });
  });

  it("does not treat login-like paths as login", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/loginx", hasSessionCookie: false, actor: null });

    expect(decision.redirectTo).toBe("/admin/login");
  });

  it("sends institution staff to login without clearing a valid session cookie", () => {
    const decision = AdminPageAccess.decide({
      pathname: "/admin/institutions",
      hasSessionCookie: true,
      actor: buildInstitutionStaffActor(),
    });

    expect(decision).toEqual({ redirectTo: "/admin/login", clearSessionCookie: false });
  });
});
