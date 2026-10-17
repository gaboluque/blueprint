import type { Metadata } from "next";
import { InstitutionsListPage } from "@/frontend/features/institutions/InstitutionsListPage";

export const metadata: Metadata = { title: "Instituciones · Saludamente" };

export default function InstitutionsPage() {
  return <InstitutionsListPage />;
}
