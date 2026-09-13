"use client";
import { Form } from "@repo/ui/forms";

import { accountClient } from "@repo/api";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccountField,
  AccountHero,
  AccountNotice,
} from "@/components/AccountScreen";
import { useApp } from "@/context/AppContext";
import { AuthScreen } from "@/components/AuthScreen";
import { hx } from "@/lib/heroui-classes";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useApp();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError(t("login.emailLabel"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await accountClient.forgotPassword({
        email: email.trim(),
      });
      setSent(true);
      if (res.resetToken) {
        router.push(
          `/reset-password/?token=${encodeURIComponent(res.resetToken)}`,
        );
      }
    } catch {
      setError(t("forgot.error") || "Could not start reset");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen variant="email" title={t("forgot.title")} backHref="/login/">
      <AccountHero
        title={t("forgot.heading")}
        description={t("forgot.subtitle")}
      />
      {sent && !error ? (
        <AccountNotice tone="success">
          {t("forgot.sent") ||
            "If that account exists, a reset link was issued. In local demo the token is opened automatically."}
        </AccountNotice>
      ) : null}
      <Form
        className="mt-7 grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <AccountField
          label={t("login.emailLabel")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder={t("login.emailLabel")}
          value={email}
          error={error ?? undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
        />
        <Button
          type="submit"
          variant="primary"
          isDisabled={busy}
          className={hx.btnPrimary}
        >
          {t("forgot.action")}
        </Button>
      </Form>
    </AuthScreen>
  );
}
