import { AdminPageAccess } from "@/app/(client)/admin/_lib/adminPageAccess";

describe("AdminPageAccess.decide", () => {
  it("sends signed-out visitors of panel pages to login", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/institutions", hasSessionCookie: false, signedIn: false });

    expect(decision).toEqual({ redirectTo: "/admin/login", clearSessionCookie: false });
  });

  it("shows login to signed-out visitors instead of redirecting it to itself", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/login", hasSessionCookie: false, signedIn: false });

    expect(decision).toEqual({ redirectTo: null, clearSessionCookie: false });
  });

  it("lets a valid session into panel pages", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin", hasSessionCookie: true, signedIn: true });

    expect(decision).toEqual({ redirectTo: null, clearSessionCookie: false });
  });

  it("sends a valid session away from login to the panel", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/login", hasSessionCookie: true, signedIn: true });

    expect(decision).toEqual({ redirectTo: "/admin", clearSessionCookie: false });
  });

  it("treats an invalid cookie as signed out on panel pages and clears it", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/institutions", hasSessionCookie: true, signedIn: false });

    expect(decision).toEqual({ redirectTo: "/admin/login", clearSessionCookie: true });
  });

  it("shows login for an invalid cookie and clears it, so login doesn't bounce back to the panel", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/login", hasSessionCookie: true, signedIn: false });

    expect(decision).toEqual({ redirectTo: null, clearSessionCookie: true });
  });

  it("doesn't treat paths that only share the login prefix as login", () => {
    const decision = AdminPageAccess.decide({ pathname: "/admin/loginx", hasSessionCookie: false, signedIn: false });

    expect(decision.redirectTo).toBe("/admin/login");
  });
});
