import type { Metadata } from "next";
import { StudentDetailPage } from "@/frontend/features/students/StudentDetailPage";

export const metadata: Metadata = { title: "Estudiante · Saludamente" };

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailPage key={id} studentId={id} />;
}
