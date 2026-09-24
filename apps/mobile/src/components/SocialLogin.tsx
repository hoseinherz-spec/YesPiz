"use client";
import { Capacitor } from "@capacitor/core";
import { nativeSignIn, nativeAuthAvailable } from "@/lib/native-auth";
import styles from "./SocialLogin.module.css";
import { SocialLogo } from "./SocialLogos";
import { AppText } from "@/components/Text";

import Script from "next/script";
import { accountClient } from "@repo/api";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
          options: {
            theme: string;
            size: string;
            text: string;
            shape: string;
            type: string;
            width?: number;
          },
        ) => void;
      };
    };
  };
  FB?: {
    init: (options: {
      appId: string;
      version: string;
      cookie: boolean;
    }) => void;
    login: (
      callback: (response: { authResponse?: { accessToken: string } }) => void,
      options: { scope: string },
    ) => void;
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

const subscribePlatform = () => () => {};

export function SocialLogin({
  onSuccess,
  withSeparator = false,
  variant = "default",
}: {
  onSuccess: () => void;
  withSeparator?: boolean;
  variant?: "default" | "auth";
}) {
  const { loginWithSocial, authLoading, t } = useApp();
  const native = useSyncExternalStore(
    subscribePlatform,
    () => Capacitor.isNativePlatform(),
    () => false,
  );
  const googleButton = useRef<HTMLDivElement>(null);
  const requestLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState({
    google: false,
    apple: false,
    facebook: false,
  });
  const [providersReady, setProvidersReady] = useState(false);
  const facebookId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const facebookVersion = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION;
  const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appleId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const appleRedirect = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;
  useEffect(() => {
    let cancelled = false;
    accountClient
      .socialProviders()
      .then((value) => {
        if (!cancelled) {
          setAvailable(value);
          setProvidersReady(true);
        }
      })
      .catch(() => {
        // Keep locally configured providers usable when discovery is
        // temporarily unreachable; the login endpoint still validates them.
        if (!cancelled) {
          setAvailable({
            google:
              Boolean(googleId) ||
              (native && nativeAuthAvailable("google")),
            apple:
              Boolean(appleId && appleRedirect) ||
              (native && nativeAuthAvailable("apple")),
            facebook: Boolean(facebookId && facebookVersion),
          });
          setProvidersReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appleId, appleRedirect, facebookId, facebookVersion, googleId, native]);
  const [appleReady, setAppleReady] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);
  const showGoogle =
    available.google &&
    (native ? nativeAuthAvailable("google") : Boolean(googleId));
  const showApple =
    available.apple &&
    (native
      ? nativeAuthAvailable("apple")
      : Boolean(appleId && appleRedirect));
  const showFacebook =
    available.facebook &&
    !native &&
    Boolean(facebookId && facebookVersion);
  const hasSocialProvider = showGoogle || showApple || showFacebook;
  const finish = useCallback(
    async (
      provider: "google" | "apple" | "facebook",
      token: string,
      nonce: string,
    ) => {
      if (requestLock.current) return;
      requestLock.current = true;
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
        requestLock.current = false;
        setBusy(false);
      }
    },
    [loginWithSocial, onSuccess, t, setError],
  );

  const nativeLogin = async (provider: "google" | "apple") => {
    if (busy || authLoading || requestLock.current) return;
    setBusy(true);
    setError(null);
    try {
      const result = await nativeSignIn(provider);
      await finish(provider, result.token, result.nonce);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("login.errorGeneric"),
      );
    } finally {
      setBusy(false);
    }
  };

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
      shape: "circle",
      type: "icon",
    });
  };
  const appleLogin = async () => {
    const auth = (window as IdentityWindow).AppleID?.auth;
    if (busy) return;
    if (!auth || !appleId || !appleRedirect) {
      setError(
        "Apple sign-in is not available yet. Please continue with email.",
      );
      return;
    }
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

  const facebookLogin = () => {
    const sdk = (window as IdentityWindow).FB;
    if (busy || authLoading) return;
    if (!sdk || !facebookReady) {
      setError(
        "Facebook sign-in is not available yet. Please continue with email.",
      );
      return;
    }
    setError(null);
    setBusy(true);
    sdk.login(
      (response) => {
        if (!response.authResponse) {
          setBusy(false);
          return;
        }
        void finish(
          "facebook",
          response.authResponse.accessToken,
          crypto.randomUUID(),
        );
      },
      { scope: "public_profile,email" },
    );
  };

  if (!providersReady || !hasSocialProvider) return null;

  return (
    <div
      className="w-full flex shrink-0 flex-col items-center gap-3"
      aria-busy={busy || authLoading}
    >
      {(withSeparator || variant === "auth") && hasSocialProvider && (
        <div className="flex w-full items-center gap-3 py-1 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          <span>{variant === "auth" ? "Or Use" : "or"}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      {!native && googleId && available.google && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onReady={initGoogle}
          onError={() =>
            setError("Google sign-in could not load. Please try again.")
          }
        />
      )}
      {!native && appleId && appleRedirect && available.apple && (
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          onReady={() => setAppleReady(true)}
          onError={() =>
            setError("Apple sign-in could not load. Please try again.")
          }
        />
      )}
      {!native && facebookId && facebookVersion && available.facebook && (
        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          onReady={() => {
            (window as IdentityWindow).FB?.init({
              appId: facebookId,
              version: facebookVersion,
              cookie: false,
            });
            setFacebookReady(true);
          }}
          onError={() =>
            setError("Facebook sign-in could not load. Please try again.")
          }
        />
      )}
      <div
        className={`${styles.row} ${variant === "auth" ? styles.authRow : ""}`}
      >
        {showApple && (
          <button
            type="button"
            aria-label="Continue with Apple"
            className={`${styles.tile} ${styles.apple}`}
            disabled={busy || authLoading || (!native && !appleReady)}
            onClick={() => void (native ? nativeLogin("apple") : appleLogin())}
          >
            <SocialLogo provider="apple" />
            <span>{variant === "auth" ? "Apple" : "Continue with Apple"}</span>
          </button>
        )}
        {showFacebook && (
          <button
            type="button"
            aria-label="Continue with Facebook"
            className={`${styles.tile} ${styles.facebook}`}
            disabled={busy || authLoading || !facebookReady}
            onClick={facebookLogin}
          >
            <SocialLogo provider="facebook" />
            <span>Continue with Facebook</span>
          </button>
        )}
        {showGoogle && (
          <div
            className={`${styles.tile} ${styles.google}`}
            aria-busy={busy || authLoading}
          >
            {native ? (
              <button
                type="button"
                className={styles.googleFallback}
                disabled={busy || authLoading}
                onClick={() => void nativeLogin("google")}
              >
                <SocialLogo provider="google" />
                <span>Continue with Google</span>
              </button>
            ) : (
              <div
                ref={googleButton}
                className={`${styles.googleAction} ${busy || authLoading ? styles.blocked : ""}`}
              />
            )}
          </div>
        )}
      </div>
      {error && (
        <AppText as="p" role="alert" className="text-sm text-danger">
          {error}
        </AppText>
      )}
    </div>
  );
}
