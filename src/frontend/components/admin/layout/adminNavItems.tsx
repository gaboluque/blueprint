import type { ReactNode } from "react";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { InstitutionsIcon } from "@/frontend/icons/InstitutionsIcon";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

/** Primary destinations, shared by the desktop top nav and the mobile nav bar. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: AdminRoutes.institutions, label: "Institutions", icon: <InstitutionsIcon /> },
];
