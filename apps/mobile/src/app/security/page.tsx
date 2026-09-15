"use client";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
export default function SecurityPage() {
  const { accessToken } = useApp();
  const [keys, setKeys] = useState<Array<{ _id: string; name: string }>>([]),
    [password, setPassword] = useState(""),
    [name, setName] = useState("My device"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [supported, setSupported] = useState(false);
  useEffect(() => {
    if (typeof PublicKeyCredential !== "undefined")
      void PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setSupported)
        .catch(() => setSupported(false));
  }, []);
  useEffect(() => {
    if (accessToken)
      void apiRequest<typeof keys>(
        "/api/v1/account/passkeys",
        withAuth({ accessToken }),
      )
        .then(setKeys)
        .catch((e) => setError(e.message));
  }, [accessToken]);
  async function enroll() {
    if (busy || !accessToken) return;
    setBusy(true);
    setError("");
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const request = await apiRequest<{
        requestId: string;
        options: Parameters<typeof startRegistration>[0]["optionsJSON"];
      }>(
        "/api/v1/account/passkeys/register/options",
        withAuth({ accessToken, method: "POST", body: { password } }),
      );
      const response = await startRegistration({
        optionsJSON: request.options,
      });
      await apiRequest(
        "/api/v1/account/passkeys/register/verify",
        withAuth({
          accessToken,
          method: "POST",
          body: { requestId: request.requestId, response, name },
        }),
      );
      setPassword("");
      setKeys(
        await apiRequest<typeof keys>(
          "/api/v1/account/passkeys",
          withAuth({ accessToken }),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create passkey.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppFrame className="reference-screen">
      <ScreenHeader title="Security" />
      <p className="text-sm leading-6 text-muted">
        A passkey uses your device’s fingerprint, face recognition or screen
        lock. Yespiz never receives biometric data. Password sign-in stays
        available.
      </p>
      {!accessToken ? (
        <Link href="/login/?next=/security/" className="mt-6 underline">
          Sign in to manage security
        </Link>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {keys.map((key) => (
              <div
                key={key._id}
                className="data-surface flex items-center justify-between rounded-2xl p-4"
              >
                <span>{key.name}</span>
                <Button
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => {
                    setBusy(true);
                    void apiRequest(
                      `/api/v1/account/passkeys/${key._id}`,
                      withAuth({ accessToken, method: "DELETE" }),
                    )
                      .then(() =>
                        setKeys((old) => old.filter((k) => k._id !== key._id)),
                      )
                      .catch((e) => setError(e.message))
                      .finally(() => setBusy(false));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void enroll();
            }}
          >
            <label className="block text-sm">
              Device label
              <input
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl bg-field-background px-4"
              />
            </label>
            <label className="block text-sm">
              Confirm current password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl bg-field-background px-4"
              />
            </label>
            <Button
              type="submit"
              isDisabled={busy || !supported}
              className="min-h-12 w-full rounded-full"
            >
              {busy ? "Waiting for your device…" : "Add a passkey"}
            </Button>
            {!supported && (
              <p className="text-sm text-muted">
                This browser does not expose device passkeys. Use a supported
                secure browser to register.
              </p>
            )}
          </form>
        </>
      )}
      {error && (
        <p role="alert" className="mt-4 text-danger">
          {error}
        </p>
      )}
    </AppFrame>
  );
}
