"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { safeAuthDestination } from "@/lib/auth-destination";
import { AuthPage } from "@/components/auth/AuthPage";
import { Button } from "@heroui/react";

export default function CompleteSignInPage() {
  const router = useRouter();
  const app = useApp();
  const {
    addresses,
    addressesError,
    addressesLoading,
    authed,
    hydrated,
    refreshAddresses,
  } = app;

  useEffect(() => {
    if (!hydrated) return;
    const destination = safeAuthDestination(window.location.search);
    if (!authed) {
      router.replace(
        `/auth/sign-in/?next=${encodeURIComponent(destination)}`,
      );
      return;
    }
    if (addressesLoading || addressesError) return;
    if (addresses.length === 0) {
      router.replace(
        `/addresses/new/?from=onboarding&next=${encodeURIComponent(destination)}`,
      );
      return;
    }
    router.replace(destination);
  }, [addresses.length, addressesError, addressesLoading, authed, hydrated, router]);

  return (
    <AuthPage
      title="Preparing your account"
      description="Checking your saved delivery locations…"
    >
      {addressesError ? (
        <div className="grid gap-4" role="alert">
          <p className="rounded-[18px] border border-border bg-card px-4 py-3 text-sm text-danger">
            We could not check your saved locations. Your account is still signed in.
          </p>
          <Button
            variant="primary"
            isPending={addressesLoading}
            onPress={() => void refreshAddresses().catch(() => undefined)}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="grid gap-3" aria-live="polite" aria-busy="true">
          <div className="h-16 animate-pulse rounded-[18px] bg-surface-secondary" />
          <div className="h-16 animate-pulse rounded-[18px] bg-surface-secondary" />
        </div>
      )}
    </AuthPage>
  );
}
