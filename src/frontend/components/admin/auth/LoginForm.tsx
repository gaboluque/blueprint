"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { AdminSession } from "@/frontend/gateway/session";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { useFormValues } from "@/frontend/hooks/useFormValues";
import { useMutation } from "@/frontend/hooks/useMutation";
import { Alert } from "@/frontend/components/ui/Alert";
import { Button } from "@/frontend/components/ui/Button";
import { TextField } from "@/frontend/components/ui/TextField";

export function LoginForm() {
  const router = useRouter();
  const { values, setField } = useFormValues({ email: "", password: "" });
  const signIn = useMutation(AdminSession.signIn, { redirectOnUnauthorized: false });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await signIn.run(values);
    if (!result.ok) return;
    router.replace(AdminRoutes.institutions);
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-label="Sign in">
      {signIn.error && <Alert>{signIn.error}</Alert>}
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={setField("email")}
        error={signIn.fieldErrors.email}
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={values.password}
        onChange={setField("password")}
        error={signIn.fieldErrors.password}
      />
      <Button type="submit" className="w-full" disabled={signIn.pending}>
        {signIn.pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
