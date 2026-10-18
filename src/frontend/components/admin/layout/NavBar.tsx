"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/frontend/components/ui/cx";
import { ADMIN_NAV_ITEMS } from "./adminNavItems";

/** Primary nav on small screens; the top bar's inline `<nav>` covers the same destinations from `md:` up. */
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cx(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                  isActive ? "text-sky-800" : "text-slate-500 hover:text-sky-800",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
