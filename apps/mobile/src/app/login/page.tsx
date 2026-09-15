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

type LoginMethod = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const destination = useAuthDestination();
  const {
    t,
    sendOtp,
    loginWithOtp,
    loginWithPassword,
    loginWithPasskey,
    authLoading,
    authError,
    clearAuthError,
  } = useApp();
  const [method, setMethod] = useState<LoginMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  const completeLogin = () => router.replace(destination);

  const submitPassword = async () => {
    clearAuthError();
    setValidation(null);
    if (!email.trim() || !email.includes("@") || password.length < 8) {
      setValidation(
        !email.includes("@") ? t("login.emailLabel") : t("signup.passwordHint"),
      );
      return;
    }
    try {
      await loginWithPassword(email.trim(), password);
      completeLogin();
    } catch {
      // Context exposes the API error.
    }
  };

  const submitOtp = async () => {
    clearAuthError();
    setValidation(null);
    if (!phone.trim()) {
      setValidation(t("login.phone"));
      return;
    }
    try {
      if (!otpSent) {
        await sendOtp(phone.trim());
        setOtpSent(true);
        return;
      }
      if (code.trim().length < 4) {
        setValidation(t("login.code"));
        return;
      }
      await loginWithOtp(phone.trim(), code.trim());
      completeLogin();
    } catch {
      // Context exposes the API error.
    }
  };

  return (
    <AuthScreen
      variant="welcome"
      title={t("login.signIn")}
      backHref="/onboarding/"
    >
      <AccountHero
        title={t("login.welcome")}
        description={t("login.subtitle")}
      />

      <Link
        href="/home/"
        className="mb-6 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground"
      >
        {t("common.browseMenu")}
      </Link>
      <div className="mb-7 grid grid-cols-2 rounded-full bg-card p-1">
        {(["password", "otp"] as const).map((value) => (
          <Button
            key={value}
            variant={method === value ? "primary" : "ghost"}
            onPress={() => {
              setMethod(value);
              setValidation(null);
              clearAuthError();
            }}
            className="h-12 rounded-full font-semibold"
          >
            {t(value === "password" ? "login.tabPassword" : "login.tabOtp")}
          </Button>
        ))}
      </div>

      {authError || validation ? (
        <AccountNotice tone="danger">{authError ?? validation}</AccountNotice>
      ) : null}

      {method === "password" ? (
        <Form
          className="mt-4 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPassword();
          }}
        >
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
            autoComplete="current-password"
            placeholder={t("login.password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button
            variant="ghost"
            onPress={() => router.push("/forgot-password/")}
            className="h-auto justify-end self-end px-1 py-1 font-semibold text-foreground"
          >
            {t("login.forgot")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isPending={authLoading}

            className={hx.btnPrimary}
          >
            {t("login.signIn")}
          </Button>
        </Form>
      ) : (
        <Form
          className="mt-4 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitOtp();
          }}
        >
          <AccountField
            label={t("login.phone")}
            name="phone"
            required
            pattern="\+?[0-9 ()-]{7,20}"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("login.phonePlaceholder")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          {otpSent ? (
            <>
              <AccountField
                label={t("login.code")}
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder={t("login.codePlaceholder")}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
              />
              <AppText as="p" className="text-sm text-muted">
                {t("login.otpHint")}
              </AppText>
            </>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            isPending={authLoading}

            className={hx.btnPrimary}
          >
            {t(otpSent ? "login.confirmOtp" : "login.sendOtp")}
          </Button>
        </Form>
      )}

      <AppText
        as="p"
        className="mt-6 text-center text-sm font-medium text-muted"
      >
        {t("login.noAccount")}{" "}
        <Link
          href={`/signup/?next=${encodeURIComponent(destination)}`}
          className="font-bold text-foreground"
        >
          {t("login.signupLink")}
        </Link>
      </AppText>

      {(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        (process.env.NEXT_PUBLIC_APPLE_CLIENT_ID &&
          process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI)) && (
        <div className="mt-auto pt-10">
          <div className="flex items-center gap-3 text-muted">
            <span className="h-px flex-1 bg-border" />
            <AppText as="span" className="text-sm font-semibold">
              {t("login.orUse")}
            </AppText>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="secondary" isDisabled={authLoading} className="min-h-12 w-full rounded-full" onPress={()=>{void loginWithPasskey().then(completeLogin).catch(()=>undefined);}}>Sign in with a passkey</Button>
          <SocialLogin onSuccess={completeLogin} />
        </div>
      )}
    </AuthScreen>
  );
}
