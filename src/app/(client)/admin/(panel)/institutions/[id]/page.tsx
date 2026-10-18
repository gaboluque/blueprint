import type { Metadata } from "next";
import { InstitutionDetailPage } from "@/frontend/features/institutions/InstitutionDetailPage";

export const metadata: Metadata = { title: "Institution · Blueprint" };

export default async function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstitutionDetailPage key={id} institutionId={id} />;
}
