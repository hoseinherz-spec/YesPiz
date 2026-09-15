"use client";
import { AppText } from "@/components/Text";

import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";

type IdentityWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (options: {
          client_id: string;
          nonce: string;
          callback: (result: { credential: string }) => void;
        }) => void;
        renderButton: (
          element: HTMLElement,
          options: { theme: string; size: string; text: string; width: number },
        ) => void;
      };
    };
  };
  AppleID?: {
    auth: {
      init: (options: {
        clientId: string;
        scope: string;
        redirectURI: string;
        state: string;
        nonce: string;
        usePopup: boolean;
      }) => void;
      signIn: () => Promise<{
        authorization: { id_token: string; state: string };
      }>;
    };
  };
};

export function SocialLogin({ onSuccess }: { onSuccess: () => void }) {
  const { loginWithSocial, authLoading, t } = useApp();
  const googleButton = useRef<HTMLDivElement>(null);
  const [appleReady, setAppleReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appleId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const appleRedirect = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;
  const finish = useCallback(
    async (provider: "google" | "apple", token: string, nonce: string) => {
      setBusy(true);
      setError(null);
      try {
        await loginWithSocial(provider, token, nonce);
        onSuccess();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : t("login.errorGeneric"),
        );
      } finally {
        setBusy(false);
      }
    },
    [loginWithSocial, onSuccess, t],
  );

  const initGoogle = () => {
    if (!googleId || !googleButton.current) return;
    const nonce = crypto.randomUUID();
    const sdk = (window as IdentityWindow).google?.accounts.id;
    sdk?.initialize({
      client_id: googleId,
      nonce,
      callback: ({ credential }) => {
        void finish("google", credential, nonce);
      },
    });
    sdk?.renderButton(googleButton.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: 280,
    });
  };
  const appleLogin = async () => {
    const auth = (window as IdentityWindow).AppleID?.auth;
    if (!auth || !appleId || !appleRedirect || busy) return;
    setBusy(true);
    setError(null);
    const nonce = crypto.randomUUID();
    const state = crypto.randomUUID();
    try {
      auth.init({
        clientId: appleId,
        scope: "name email",
        redirectURI: appleRedirect,
        state,
        nonce,
        usePopup: true,
      });
      const result = await auth.signIn();
      if (result.authorization.state !== state)
        throw new Error(t("login.errorGeneric"));
      await finish("apple", result.authorization.id_token, nonce);
    } catch (cause) {
      if ((cause as { error?: string })?.error !== "popup_closed_by_user")
        setError(t("login.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="mt-5 flex flex-col items-center gap-3"
      aria-busy={busy || authLoading}
    >
      {googleId ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            onReady={initGoogle}
            onError={() =>
              setError(t("login.socialUnavailable", { provider: "Google" }))
            }
          />
          <div
            ref={googleButton}
            className={
              busy || authLoading ? "pointer-events-none opacity-50" : ""
            }
          />
        </>
      ) : null}
      {appleId && appleRedirect && (
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          onReady={() => setAppleReady(true)}
          onError={() =>
            setError(t("login.socialUnavailable", { provider: "Apple" }))
          }
        />
      )}
      {appleId && appleRedirect && (
        <button
          type="button"
          disabled={!appleReady || busy || authLoading}
          onClick={() => void appleLogin()}
          className="h-12 w-full rounded-2xl bg-foreground font-semibold text-background disabled:opacity-50"
        >
          Apple
        </button>
      )}
      {error && (
        <AppText as="p" role="alert" className="text-sm text-danger">
          {error}
        </AppText>
      )}
    </div>
  );
}
