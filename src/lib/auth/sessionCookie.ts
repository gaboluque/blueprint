import type { NextResponse } from "next/server";

const COOKIE_NAME = "blueprint_admin_session";

function read(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    return value ? decodeURIComponent(value) : null;
  }
  return null;
}

/** httpOnly keeps it from JS; SameSite=Lax blocks cross-site POST/PATCH/DELETE. */
function set(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

function clear(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export const SessionCookie = { name: COOKIE_NAME, read, set, clear };
