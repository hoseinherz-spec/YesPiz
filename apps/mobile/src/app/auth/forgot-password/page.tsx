"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Form, toast } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { accountClient } from "@repo/api";
import { useAuthDestination } from "@/lib/auth-destination";
import { AuthPage } from "@/components/auth/AuthPage";
import styles from "@/components/auth/auth.module.css";
import { AuthField, AuthSubmit } from "@/components/auth/AuthControls";

type ForgotValues = { email: string };
export default function ForgotPasswordPage() {
  const router = useRouter();
  const destination = useAuthDestination();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ForgotValues>({ defaultValues: { email: "" } });
  const email = useWatch({ control, name: "email" });
  const [busy, setBusy] = useState(false);
  const signIn = `/auth/sign-in/?next=${encodeURIComponent(destination)}`;
  const submit = handleSubmit(async ({ email }) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await accountClient.forgotPassword({
        email: email.trim(),
      });
      sessionStorage.setItem(
        "password-reset-challenge",
        JSON.stringify(result),
      );
      router.push(
        `/auth/forgot-password/confirm/?next=${encodeURIComponent(destination)}`,
      );
    } catch (cause) {
      toast.danger("Could not send reset code", {
        description:
          cause instanceof Error ? cause.message : "Please try again.",
        timeout: 5000,
      });
    } finally {
      setBusy(false);
    }
  });
  return (
    <AuthPage
      footer={
        <AuthSubmit
          form="auth-form"
          isDisabled={busy || !email.trim()}
          aria-busy={busy}
        >
          {busy ? "Sending code…" : "Send reset code"}
        </AuthSubmit>
      }
      title="Forgot Password"
      description="Enter your email to receive a five-digit reset code"
      backHref={signIn}
    >
      <Form id="auth-form" className={styles.form} onSubmit={submit}>
        <AuthField
          label="Email address"
          placeholder="Email Address"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          disabled={busy}
          error={errors.email?.message}
          {...register("email", {
            required: "Enter your email address.",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email address.",
            },
          })}
        />
      </Form>
      <p className={styles.switch}>
        Remember your password? <Link href={signIn}>Sign in</Link>
      </p>
    </AuthPage>
  );
}
