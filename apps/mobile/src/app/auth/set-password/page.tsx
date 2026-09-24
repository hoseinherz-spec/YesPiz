"use client";
import { Suspense, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Form, toast } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { accountClient } from "@repo/api";
import { useAuthDestination } from "@/lib/auth-destination";
import { AuthPage } from "@/components/auth/AuthPage";
import styles from "@/components/auth/auth.module.css";
import { AuthField, AuthSubmit } from "@/components/auth/AuthControls";

type PasswordValues = { password: string; confirmation: string };
function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const signup = params.get("signup") === "1";
  const signupToken = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem("signup-password-token") || "",
    () => "",
  );
  const token = signup ? signupToken : params.get("token") || "";
  const destination = useAuthDestination();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PasswordValues>({ defaultValues: { password: "", confirmation: "" } });
  const password = useWatch({ control, name: "password" });
  const confirmation = useWatch({ control, name: "confirmation" });
  const [busy, setBusy] = useState(false);
  const signIn = `/auth/sign-in/?next=${encodeURIComponent(destination)}`;
  const forgot = `/auth/forgot-password/?next=${encodeURIComponent(destination)}`;
  const submit = handleSubmit(async ({ password, confirmation }) => {
    if (busy || !token) return;
    if (password !== confirmation) {
      toast.danger("Passwords don’t match", { timeout: 5000 });
      return;
    }
    if (password.length < 8) {
      toast.danger("Use at least 8 characters", { timeout: 5000 });
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        await accountClient.completeSignup({ token, password });
        sessionStorage.removeItem("signup-password-token");
      } else {
        await accountClient.resetPassword({ token, password });
      }
      toast.success(signup ? "Account created" : "Password updated", {
        description: "Sign in with your new password.",
        timeout: 4000,
      });
      router.replace(signIn);
    } catch {
      toast.danger(signup ? "Unable to create your account" : "Unable to update password", {
        description: signup
          ? "Your verification may have expired. Please sign up again, or sign in if your account was already created."
          : "This link may have expired or already been used. Request a new link and try again.",
        timeout: 5000,
      });
    } finally {
      setBusy(false);
    }
  });
  return (
    <AuthPage
      footer={
        token ? (
          <AuthSubmit
            form="auth-form"
            isDisabled={busy || password.length < 8 || !confirmation}
            aria-busy={busy}
          >
            {busy ? "Saving password…" : signup ? "Set Password" : "Reset Now"}
          </AuthSubmit>
        ) : null
      }
      title={signup ? "Set Password" : "Reset Password"}
      description="Enter your new password"
      backHref={signIn}
    >
      {!token ? (
        <>
          <p role="alert" className={styles.notice}>
            {signup
              ? "Please verify your email before setting your password."
              : "This page needs a verified password reset code."}
          </p>
          <Link
            className={styles.primary}
            href={signup ? "/auth/sign-up/" : forgot}
          >
            {signup ? "Return to sign up" : "Request a reset code"}
          </Link>
        </>
      ) : (
        <>
          <Form id="auth-form" className={styles.form} onSubmit={submit}>
            <AuthField label="New password" placeholder="Password" autoComplete="new-password" maxLength={72} isPassword disabled={busy} error={errors.password?.message} {...register("password", { required: "Enter a new password.", minLength: { value: 8, message: "Use at least 8 characters." } })} />
            <AuthField label="Confirm password" placeholder="Confirm Password" autoComplete="new-password" maxLength={72} isPassword disabled={busy} error={errors.confirmation?.message} {...register("confirmation", { required: "Confirm your new password.", validate: (value) => value === password || "Passwords don’t match." })} />
            <p id="password-hint" className={styles.hint}>
              Use at least 8 characters.
            </p>
          </Form>
          <p className={styles.switch}>
            {signup ? "Verification expired? " : "Reset expired? "}
            <Link href={signup ? "/auth/sign-up/" : forgot}>
              Request a new one
            </Link>
          </p>
        </>
      )}
    </AuthPage>
  );
}
export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPage
          title="Set your password"
          description="Loading your reset link…"
        >
          <p role="status">Loading…</p>
        </AuthPage>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
