import { redirect } from "next/navigation";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";

export default function HomePage() {
  redirect(AdminRoutes.home);
}
