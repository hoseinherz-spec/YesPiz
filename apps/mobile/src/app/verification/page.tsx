"use client";
import { Form } from "@repo/ui/forms";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import {
  AccountField,
  AccountHero,
  AccountNotice,
  AccountScreen,
} from "@/components/AccountScreen";
import { useApp } from "@/context/AppContext";
import { hx } from "@/lib/heroui-classes";

export default function VerificationPage() {
  const router = useRouter();
  const { t } = useApp();
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => "",
  );
  const email = new URLSearchParams(search).get("email") ?? "your email";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const verify = () => {
    if (code !== "1234") {
      setError(t("verification.invalid"));
      return;
    }
    router.push(`/reset-password/?email=${encodeURIComponent(email)}`);
  };

  return (
    <AccountScreen title={t("verification.title")} backHref="/forgot-password/">
      <AccountHero
        title={t("verification.heading")}
        description={t("verification.subtitle", { email })}
      />

      <Form
        className="grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          verify();
        }}
      >
        <AccountField
          label={t("login.code")}
          name="verificationCode"
          required
          pattern="[0-9]{4}"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={4}
          placeholder="••••"
          value={code}
          error={error ?? undefined}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 4));
            setError(null);
          }}
          className="h-20 text-center text-[28px] tracking-[1.4em] indent-[1.4em]"
        />
        {showHint ? <AccountNotice>1234</AccountNotice> : null}
        <Button
          type="button"
          variant="ghost"
          onPress={() => setShowHint(true)}
          className="h-auto justify-center px-3 py-2 font-semibold text-muted"
        >
          {t("verification.resend")}
        </Button>
        <Button
          type="submit"
          variant="primary"

          className={hx.btnPrimary}
        >
          {t("verification.action")}
        </Button>
      </Form>
    </AccountScreen>
  );
}
