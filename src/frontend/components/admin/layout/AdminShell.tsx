import Link from "next/link";
import type { ReactNode } from "react";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { SignOutButton } from "./SignOutButton";

type AdminShellProps = {
  adminName: string;
  children: ReactNode;
};

export function AdminShell({ adminName, children }: AdminShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href={AdminRoutes.home} className="font-semibold text-teal-800">
              Blueprint · Admin
            </Link>
            <nav aria-label="Main">
              <ul className="flex gap-4 text-sm">
                <li>
                  <Link href={AdminRoutes.institutions} className="text-slate-700 hover:text-teal-800">
                    Institutions
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{adminName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">{children}</main>
    </div>
  );
}
