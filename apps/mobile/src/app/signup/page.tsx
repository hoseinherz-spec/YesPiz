"use client";
import { AppText } from "@/components/Text";

import { Form } from "@repo/ui/forms";

import { SocialLogin } from "@/components/SocialLogin";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccountField,
  AccountHero,
  AccountNotice,
  PasswordField,
} from "@/components/AccountScreen";
import { useApp } from "@/context/AppContext";
import { AuthScreen } from "@/components/AuthScreen";
import { useAuthDestination } from "@/lib/auth-destination";
import { hx } from "@/lib/heroui-classes";

export default function SignupPage() {
  const router = useRouter();
  const destination = useAuthDestination();
  const { t, register, authLoading, authError, clearAuthError } = useApp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validation, setValidation] = useState<string | null>(null);

  const submit = async () => {
    clearAuthError();
    setValidation(null);
    if (!firstName.trim() || !lastName.trim() || !email.includes("@")) {
      setValidation(t("login.errorGeneric"));
      return;
    }
    if (password.length < 8) {
      setValidation(t("signup.passwordHint"));
      return;
    }
    try {
      await register(email.trim(), password, firstName.trim(), lastName.trim());
      router.replace(destination);
    } catch {
      // Context exposes the API error.
    }
  };

  return (
    <AuthScreen
      variant="signup"
      title={t("signup.title")}
      backHref="/onboarding/"
    >
      <AccountHero
        title={t("signup.title")}
        description={t("signup.subtitle")}
      />

      <Link
        href="/home/"
        className="mb-6 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
      >
        {t("common.browseMenu")}
      </Link>

      {authError || validation ? (
        <AccountNotice tone="danger">{authError ?? validation}</AccountNotice>
      ) : null}

      <Form
        className="mt-4 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <AccountField
            label={t("login.firstName")}
            name="firstName"
            autoComplete="given-name"
            placeholder={t("login.firstName")}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="px-4"
          />
          <AccountField
            label={t("login.lastName")}
            name="lastName"
            autoComplete="family-name"
            placeholder={t("login.lastName")}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="px-4"
          />
        </div>
        <AccountField
          label={t("login.emailLabel")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("login.emailLabel")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <PasswordField
          label={t("login.password")}
          name="password"
          autoComplete="new-password"
          placeholder={t("login.password")}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <AppText as="p" className="text-sm text-muted">
          {t("signup.passwordHint")}
        </AppText>
        <Button
          type="submit"
          variant="primary"
          isPending={authLoading}

          className={hx.btnPrimary}
        >
          {t("signup.action")}
        </Button>
      </Form>

      <AppText
        as="p"
        className="mt-6 text-center text-sm font-medium text-muted"
      >
        {t("signup.haveAccount")}{" "}
        <Link
          href={`/login/?next=${encodeURIComponent(destination)}`}
          className="font-bold text-foreground"
        >
          {t("signup.loginLink")}
        </Link>
      </AppText>
      <AppText
        as="p"
        className="mt-auto pt-8 text-center text-xs leading-relaxed text-muted"
      >
        {t("signup.terms")}
      </AppText>
      <SocialLogin onSuccess={() => router.replace(destination)} />
    </AuthScreen>
  );
}
