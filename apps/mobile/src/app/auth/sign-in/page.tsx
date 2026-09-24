"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Form, toast } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { useApp } from "@/context/AppContext";
import {
  authCompletionDestination,
  safeAuthDestination,
  useAuthDestination,
} from "@/lib/auth-destination";
import { SocialLogin } from "@/components/SocialLogin";
import { AuthPage } from "@/components/auth/AuthPage";
import styles from "@/components/auth/auth.module.css";
import { AuthField, AuthSubmit } from "@/components/auth/AuthControls";

type SignInValues = { email: string; password: string };

export default function SignInPage() {
  const router = useRouter();
  const destination = useAuthDestination();
  const app = useApp();
  const { authed, hydrated, authError, clearAuthError, completeOnboarding } =
    app;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignInValues>({ defaultValues: { email: "", password: "" } });
  const email = useWatch({ control, name: "email" });
  const password = useWatch({ control, name: "password" });
  const finish = () => {
    completeOnboarding();
    router.replace(authCompletionDestination(destination));
  };
  useEffect(() => {
    if (hydrated && authed)
      router.replace(
        authCompletionDestination(safeAuthDestination(window.location.search)),
      );
  }, [authed, hydrated, router]);
  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);
  useEffect(() => {
    if (authError) {
      toast.danger("Unable to sign in", {
        description: authError,
        timeout: 5000,
      });
    }
  }, [authError]);
  const submit = handleSubmit(async ({ email, password }) => {
    if (app.authLoading) return;
    try {
      await app.loginWithPassword(email.trim(), password);
      finish();
    } catch {
      /* API error is exposed by the auth context. */
    }
  });
  return (
    <AuthPage
      social={<SocialLogin onSuccess={finish} variant="auth" />}
      afterAction={
        <p className={styles.switch}>
          Don’t have an account?{" "}
          <Link href={`/auth/sign-up/?next=${encodeURIComponent(destination)}`}>
            Sign Up
          </Link>
        </p>
      }
      footer={
        <AuthSubmit
          form="auth-form"
          isDisabled={app.authLoading || !email.trim() || !password}
          aria-busy={app.authLoading}
        >
          {app.authLoading ? "Signing in…" : "Log In"}
        </AuthSubmit>
      }
      title="Log In"
      description="Enter details to log in"
      backHref="/onboarding/?signin=1"
      backLabel="Back to sign-in options"
    >
      <Form
        id="auth-form"
        onSubmit={submit}
        className={styles.form}
        validationBehavior="aria"
      >
        <AuthField
          label="Email address"
          placeholder="Email Address"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          disabled={app.authLoading}
          error={errors.email?.message}
          {...register("email", {
            required: "Enter your email address.",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email address.",
            },
          })}
        />
        <AuthField
          label="Password"
          placeholder="Password"
          autoComplete="current-password"
          isPassword
          disabled={app.authLoading}
          error={errors.password?.message}
          {...register("password", {
            required: "Enter your password.",
            minLength: {
              value: 8,
              message: "Use at least 8 characters.",
            },
          })}
        />
        <Link
          className={styles.forgot}
          href={`/auth/forgot-password/?next=${encodeURIComponent(destination)}`}
        >
          Forgot password?
        </Link>
      </Form>
    </AuthPage>
  );
}
