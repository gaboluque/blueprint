import type { ReactNode } from "react";
import { AdminPageGuard } from "@/app/(client)/admin/_lib/adminPageGuard";
import { AdminShell } from "@/frontend/components/admin/layout/AdminShell";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const admin = await AdminPageGuard.requireAdmin();
  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
