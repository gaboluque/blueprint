import type { Metadata } from "next";
import { AdminPageGuard } from "@/app/(client)/admin/_lib/adminPageGuard";
import { InstitutionsListPage } from "@/frontend/features/institutions/InstitutionsListPage";

export const metadata: Metadata = { title: "Institutions · Blueprint" };

export default async function InstitutionsPage() {
  await AdminPageGuard.requireAdmin();
  return <InstitutionsListPage />;
}
