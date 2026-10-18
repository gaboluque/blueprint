"use client";

import { useRouter } from "next/navigation";
import { AdminSession } from "@/frontend/gateway/session";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { useMutation } from "@/frontend/hooks/useMutation";
import { Button } from "@/frontend/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const signOut = useMutation(AdminSession.signOut);

  const onClick = async () => {
    const result = await signOut.run(undefined);
    if (!result.ok) return;
    router.replace(AdminRoutes.login);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {signOut.error && (
        <span role="alert" className="text-sm text-red-700">
          {signOut.error}
        </span>
      )}
      <Button variant="ghost" onClick={onClick} disabled={signOut.pending}>
        {signOut.pending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
