"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Form, toast } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { accountClient } from "@repo/api";
import { useApp } from "@/context/AppContext";
import {
  authCompletionDestination,
  safeAuthDestination,
  useAuthDestination,
} from "@/lib/auth-destination";
import { SocialLogin } from "@/components/SocialLogin";
import { AuthPage } from "@/components/auth/AuthPage";
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input";
import styles from "@/components/auth/auth.module.css";
import { AuthField, AuthSubmit } from "@/components/auth/AuthControls";

type SignUpValues = { firstName: string; lastName: string; email: string; code: string };
export default function SignUpPage() {
  const app = useApp();
  const { authed, hydrated, authError, clearAuthError, completeOnboarding } = app;
  const router = useRouter();
  const destination = useAuthDestination();
  const {
    register,
    handleSubmit,
    control,
    resetField,
    setValue,
    formState: { errors },
  } = useForm<SignUpValues>({ defaultValues: { firstName: "", lastName: "", email: "", code: "" } });
  const firstName = useWatch({ control, name: "firstName" });
  const lastName = useWatch({ control, name: "lastName" });
  const email = useWatch({ control, name: "email" });
  const code = useWatch({ control, name: "code" });
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);
  const [otpStatus, setOtpStatus] = useState<OTPStatus>("idle");
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    email: string;
    verificationCode?: string;
  } | null>(null);
  const signIn = `/auth/sign-in/?next=${encodeURIComponent(destination)}`;
  const finish = () => {
    completeOnboarding();
    router.replace(authCompletionDestination(destination));
  };
  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);
  useEffect(() => {
    if (hydrated && authed)
      router.replace(
        authCompletionDestination(safeAuthDestination(window.location.search)),
      );
  }, [authed, hydrated, router]);
  useEffect(() => {
    if (authError) {
      toast.danger("Unable to create your account", {
        description: authError,
        timeout: 5000,
      });
    }
  }, [authError]);
  const submit = handleSubmit(async (values) => {
    if (busy) return;
    setBusy(true);
    try {
      if (challenge) {
        const { token } = await accountClient.verifySignup({
          challengeId: challenge.challengeId,
          code: values.code,
        });
        sessionStorage.setItem("signup-password-token", token);
        router.push(
          `/auth/set-password/?signup=1&next=${encodeURIComponent(destination)}`,
        );
      } else {
        const nextChallenge = await accountClient.startSignup({
            email: values.email.trim(),
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
          });
        setChallenge(nextChallenge);
        setResendIn(60);
        if (nextChallenge.verificationCode) {
          setValue("code", nextChallenge.verificationCode, {
            shouldValidate: true,
          });
        }
      }
    } catch (err) {
      if (challenge) setOtpStatus("error");
      toast.danger("Unable to continue", {
        description:
          err instanceof Error
            ? err.message
            : "Unable to continue. Please try again.",
        timeout: 5000,
      });
    } finally {
      setBusy(false);
    }
  });
  return (
    <AuthPage
      social={!challenge && <SocialLogin onSuccess={finish} variant="auth" />}
      afterAction={!challenge && <p className={styles.switch}>Already have an account? <Link href={signIn}>Log In</Link></p>}
      footer={
        <AuthSubmit
          form="auth-form"
          isDisabled={
            busy ||
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            (challenge !== null && !/^\d{5}$/.test(code))
          }
          aria-busy={busy}
        >
          {busy
            ? "Please wait…"
            : challenge
              ? "Verify"
              : "Sign Up"}
        </AuthSubmit>
      }
      title={challenge ? "Verification" : "Sign Up"}
      description={
        challenge
          ? `Enter the five-digit code sent to ${challenge.email}. It expires in 10 minutes.`
          : "Enter details to sign up"
      }
      backHref={signIn}
    >
      <Form id="auth-form" className={styles.form} onSubmit={submit}>
        {!challenge && (
          <>
            <div className={styles.names}>
              <AuthField label="First name" placeholder="First name" autoComplete="given-name" maxLength={80} disabled={busy} error={errors.firstName?.message} {...register("firstName", { required: "Enter your first name." })} />
              <AuthField label="Last name" placeholder="Last name" autoComplete="family-name" maxLength={80} disabled={busy} error={errors.lastName?.message} {...register("lastName", { required: "Enter your last name." })} />
            </div>
            <AuthField label="Email address" placeholder="Email Address" type="email" autoComplete="email" autoCapitalize="none" disabled={busy} error={errors.email?.message} {...register("email", { required: "Enter your email address.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." } })} />
          </>
        )}
        {challenge && (
          <>
            <input
              type="hidden"
              {...register("code", {
                required: "Enter the verification code.",
                pattern: { value: /^\d{5}$/, message: "Enter the 5-digit code." },
              })}
            />
            <OTPInput
              length={5}
              label="Verification code"
              errorMessage={errors.code?.message ?? "That code is invalid or has expired."}
              value={code}
              status={otpStatus}
              disabled={busy}
              autoFocus
              className={styles.otp}
              onChange={(value) => {
                setOtpStatus("idle");
                setValue("code", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              className={styles.resend}
              isDisabled={busy || resendIn > 0}
              onPress={async () => {
                setBusy(true);
                try {
                  const next = await accountClient.startSignup({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() });
                  setChallenge(next);
                  setValue("code", next.verificationCode || "");
                  setOtpStatus("idle");
                  setResendIn(60);
                } catch (error) {
                  toast.danger("Could not resend code", { description: error instanceof Error ? error.message : "Please try again." });
                } finally {
                  setBusy(false);
                }
              }}
            >
              {resendIn > 0 ? <>Resend In: <strong>00:{String(resendIn).padStart(2, "0")}</strong></> : "Resend code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={styles.switch}
              isDisabled={busy}
              onPress={() => {
                setChallenge(null);
                resetField("code");
                setOtpStatus("idle");
              }}
            >
              Change email
            </Button>
          </>
        )}
      </Form>
    </AuthPage>
  );
}
