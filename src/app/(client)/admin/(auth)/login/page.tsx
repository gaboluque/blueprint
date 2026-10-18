import type { Metadata } from "next";
import { LoginForm } from "@/frontend/components/admin/auth/LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión · Blueprint" };

/** `proxy.ts` sends signed-in admins to the panel and clears invalid session cookies. */
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Blueprint</h1>
        <p className="mb-6 text-sm text-slate-600">Ingresa al panel de administración.</p>
        <LoginForm />
      </div>
    </main>
  );
}
