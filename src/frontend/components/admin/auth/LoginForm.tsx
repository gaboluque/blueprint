"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { signInBodySchema, type SignInBody } from "@/lib/auth/auth.validation";
import { AdminSession } from "@/frontend/gateway/session";
import { AdminRoutes } from "@/frontend/components/admin/adminRoutes";
import { useForm } from "@/frontend/hooks/useForm";
import { useMutation } from "@/frontend/hooks/useMutation";
import { Alert } from "@/frontend/components/ui/Alert";
import { Button } from "@/frontend/components/ui/Button";
import { TextField } from "@/frontend/components/ui/TextField";

const INITIAL_VALUES: SignInBody = { email: "", password: "" };

export function LoginForm() {
  const router = useRouter();
  const form = useForm({
    idPrefix: "sign-in",
    initialValues: INITIAL_VALUES,
    schema: signInBodySchema,
  });
  const signIn = useMutation(AdminSession.signIn, { redirectOnUnauthorized: false });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    form.setGeneralError(null);

    const validated = form.validate();
    if (!validated.ok) return;

    const result = await signIn.run(validated.data);
    if (!result.ok) {
      form.applyFieldErrors(result.fieldErrors ?? {});
      return;
    }
    router.replace(AdminRoutes.institutions);
    router.refresh();
  };

  const bannerMessage = signIn.error && (signIn.fieldErrors._root ?? form.generalError ?? signIn.error);

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-label="Sign in">
      {bannerMessage ? <Alert>{bannerMessage}</Alert> : null}
      <TextField label="Email" type="email" autoComplete="email" required field={form.getField("email")} />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        field={form.getField("password")}
      />
      <Button type="submit" className="w-full" disabled={signIn.pending}>
        {signIn.pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
