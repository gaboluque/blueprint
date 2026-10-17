import { NextRequest } from "next/server";
import { AdminSessionResolver } from "@/app/(client)/admin/_lib/adminSessionResolver";
import { proxy } from "@/proxy";

jest.mock("@/app/(client)/admin/_lib/adminSessionResolver", () => ({ AdminSessionResolver: { resolve: jest.fn() } }));

const resolve = jest.mocked(AdminSessionResolver.resolve);
const admin = {
  id: "c3d4e5f6-0000-4000-8000-000000000001",
  email: "a@ficticia.test",
  name: "Admin",
  role: "admin" as const,
};

function requestTo(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost:3001${path}`, {
    headers: cookie ? { cookie: `saludamente_admin_session=${cookie}` } : {},
  });
}

function clearsSessionCookie(response: Response): boolean {
  return /saludamente_admin_session=;.*Max-Age=0/i.test(response.headers.get("set-cookie") ?? "");
}

/** Follows proxy redirects the way a browser would, keeping cookies the proxy clears out of later hops. */
async function follow(path: string, cookie?: string, maxHops = 5): Promise<{ path: string; hops: number }> {
  let current = path;
  let currentCookie = cookie;
  for (let hops = 0; hops <= maxHops; hops++) {
    const response = await proxy(requestTo(current, currentCookie));
    if (clearsSessionCookie(response)) currentCookie = undefined;
    const location = response.headers.get("location");
    if (!location) return { path: current, hops };
    current = new URL(location).pathname;
  }
  throw new Error(`Redirect loop starting at ${path}`);
}

describe("proxy", () => {
  beforeEach(() => resolve.mockReset());

  it("redirects a signed-out visitor from the panel to login", async () => {
    resolve.mockResolvedValue(null);

    const response = await proxy(requestTo("/admin/institutions"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3001/admin/login");
    expect(clearsSessionCookie(response)).toBe(false);
  });

  it("lets a valid session through to the panel", async () => {
    resolve.mockResolvedValue(admin);

    const response = await proxy(requestTo("/admin/institutions", "valid-token"));

    expect(resolve).toHaveBeenCalledWith("valid-token");
    expect(response.headers.get("location")).toBeNull();
    expect(clearsSessionCookie(response)).toBe(false);
  });

  it("treats a garbage cookie as signed out, redirects to login, and clears it", async () => {
    resolve.mockResolvedValue(null);

    const response = await proxy(requestTo("/admin", "garbage"));

    expect(response.headers.get("location")).toBe("http://localhost:3001/admin/login");
    expect(clearsSessionCookie(response)).toBe(true);
  });

  it("settles on login for signed-out and garbage-cookie visitors without looping", async () => {
    resolve.mockResolvedValue(null);

    const signedOut = await follow("/admin");
    const garbage = await follow("/admin", "garbage");

    expect(signedOut).toEqual({ path: "/admin/login", hops: 1 });
    expect(garbage).toEqual({ path: "/admin/login", hops: 1 });
  });

  it("settles on the panel for a valid session that opens login", async () => {
    resolve.mockImplementation(async (token) => (token === "valid-token" ? admin : null));

    const result = await follow("/admin/login", "valid-token");

    expect(result).toEqual({ path: "/admin", hops: 1 });
  });
});
