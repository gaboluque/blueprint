import Link from "next/link";
import type { ReactNode } from "react";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { BlueprintLogoIcon } from "@/frontend/icons/BlueprintLogoIcon";
import { ADMIN_NAV_ITEMS } from "./adminNavItems";
import { NavBar } from "./NavBar";
import { SignOutButton } from "./SignOutButton";

type AdminShellProps = {
  adminName: string;
  children: ReactNode;
};

/** Matches mobile top bar (`py-3` + `min-h-10` controls) and `NavBar` link row (`min-h-16` + safe area). */
const MOBILE_SHELL_CLASS =
  "max-md:[--admin-mobile-header-height:4rem] max-md:[--admin-mobile-nav-height:calc(4rem+env(safe-area-inset-bottom))]";

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className={`flex min-h-dvh flex-col ${MOBILE_SHELL_CLASS}`}>
      <header className="shrink-0 border-b border-slate-200 bg-white md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href={AdminRoutes.home}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-sky-800 hover:bg-slate-100"
            aria-label="Blueprint Admin home"
          >
            <BlueprintLogoIcon />
          </Link>
          <div className="flex items-center gap-1">
            <SignOutButton iconOnly />
          </div>
        </div>
      </header>
      <header className="hidden shrink-0 border-b border-slate-200 bg-white md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href={AdminRoutes.home}
              className="inline-flex items-center gap-2 font-semibold text-sky-800 hover:text-sky-900"
            >
              <BlueprintLogoIcon className="size-6" />
              Blueprint
            </Link>
            <nav aria-label="Main">
              <ul className="flex gap-4 text-sm">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-slate-700 hover:text-sky-800">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <SignOutButton iconOnly />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl min-h-0 flex-1 space-y-6 p-2 md:p-4 max-md:max-h-[calc(100dvh-var(--admin-mobile-header-height)-var(--admin-mobile-nav-height))] max-md:overflow-y-auto max-md:pb-[var(--admin-mobile-nav-height)] md:px-6 md:py-8 md:pb-8">
        {children}
      </main>
      <NavBar />
    </div>
  );
}
