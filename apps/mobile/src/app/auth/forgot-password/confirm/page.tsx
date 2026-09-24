"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Form, toast } from "@heroui/react";
import { useForm, useWatch } from "react-hook-form";
import { accountClient, type ForgotPasswordResponse } from "@repo/api";
import { useAuthDestination } from "@/lib/auth-destination";
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthSubmit } from "@/components/auth/AuthControls";
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input";
import styles from "@/components/auth/auth.module.css";

type ConfirmValues = { code: string };

export default function ConfirmForgotPasswordPage() {
  const router = useRouter();
  const destination = useAuthDestination();
  const storedChallenge = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem("password-reset-challenge") || "",
    () => "",
  );
  const ready = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const initialChallenge = useMemo(() => {
    try {
      const parsed = storedChallenge
        ? (JSON.parse(storedChallenge) as ForgotPasswordResponse)
        : null;
      return parsed?.challengeId && parsed.email ? parsed : null;
    } catch {
      return null;
    }
  }, [storedChallenge]);
  const [resentChallenge, setResentChallenge] =
    useState<ForgotPasswordResponse | null>(null);
  const challenge = resentChallenge ?? initialChallenge;
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const [otpStatus, setOtpStatus] = useState<OTPStatus>("idle");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ConfirmValues>({ defaultValues: { code: "" } });
  const code = useWatch({ control, name: "code" });
  const forgot = `/auth/forgot-password/?next=${encodeURIComponent(destination)}`;

  useEffect(() => {
    if (challenge?.verificationCode)
      setValue("code", challenge.verificationCode);
  }, [challenge, setValue]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(
      () => setResendIn((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const submit = handleSubmit(async ({ code }) => {
    if (busy || !challenge) return;
    setBusy(true);
    setOtpStatus("idle");
    try {
      const { token } = await accountClient.confirmPasswordResetOtp({
        challengeId: challenge.challengeId,
        code,
      });
      sessionStorage.removeItem("password-reset-challenge");
      router.replace(
        `/auth/set-password/?token=${encodeURIComponent(token)}&next=${encodeURIComponent(destination)}`,
      );
    } catch (cause) {
      setOtpStatus("error");
      toast.danger("Invalid or expired code", {
        description:
          cause instanceof Error
            ? cause.message
            : "Request a new code and try again.",
        timeout: 5000,
      });
    } finally {
      setBusy(false);
    }
  });

  const resend = async () => {
    if (busy || !challenge || resendIn > 0) return;
    setBusy(true);
    try {
      const next = await accountClient.forgotPassword({
        email: challenge.email,
      });
      sessionStorage.setItem("password-reset-challenge", JSON.stringify(next));
      setResentChallenge(next);
      setValue("code", next.verificationCode || "");
      setOtpStatus("idle");
      setResendIn(60);
    } catch (cause) {
      toast.danger("Could not resend code", {
        description:
          cause instanceof Error ? cause.message : "Please try again.",
        timeout: 5000,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPage
      title="Enter reset code"
      description={
        challenge
          ? `Enter the five-digit code sent to ${challenge.email}. It expires in 10 minutes.`
          : "Confirm your email before resetting your password."
      }
      backHref={forgot}
      footer={
        challenge ? (
          <AuthSubmit
            form="auth-form"
            isDisabled={busy || !/^\d{5}$/.test(code)}
            aria-busy={busy}
          >
            {busy ? "Verifying…" : "Verify code"}
          </AuthSubmit>
        ) : null
      }
    >
      {ready && !challenge ? (
        <>
          <p role="alert" className={styles.notice}>
            Request a new code to continue.
          </p>
          <Link className={styles.primary} href={forgot}>
            Return to forgot password
          </Link>
        </>
      ) : challenge ? (
        <Form id="auth-form" className={styles.form} onSubmit={submit}>
          <input
            type="hidden"
            {...register("code", {
              required: "Enter the reset code.",
              pattern: { value: /^\d{5}$/, message: "Enter the 5-digit code." },
            })}
          />
          <OTPInput
            length={5}
            label="Password reset code"
            errorMessage={
              errors.code?.message ?? "That code is invalid or has expired."
            }
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
            onPress={resend}
          >
            {resendIn > 0 ? (
              <>
                Resend in:{" "}
                <strong>00:{String(resendIn).padStart(2, "0")}</strong>
              </>
            ) : (
              "Resend code"
            )}
          </Button>
          <p className={styles.switch}>
            Wrong email? <Link href={forgot}>Change email</Link>
          </p>
        </Form>
      ) : (
        <p role="status" className={styles.notice}>
          Loading…
        </p>
      )}
    </AuthPage>
  );
}
