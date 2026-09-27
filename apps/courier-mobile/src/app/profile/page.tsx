"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button, Spinner } from "@heroui/react";
import { couriersClient, type CourierProfile } from "@repo/api";
import { Notifications } from "@repo/api/components/notifications";
import { Moon, Sun, ShieldCheck, WalletCards, LogOut } from "lucide-react";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { VehicleProfile } from "@/components/VehicleProfile";
import { ErrorBanner } from "@/components/ProofUi";
import {
  clearCourierToken,
  getCourierToken,
  requireCourierToken,
} from "@/lib/auth";
import { formatApiError } from "@/lib/api-errors";

export default function CourierProfilePage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      setProfile(
        await couriersClient.getMe({ accessToken: requireCourierToken() }),
      );
    } catch (failure) {
      setError(formatApiError(failure, "Could not load your profile."));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!getCourierToken()) {
      router.replace("/login/");
      return;
    }
    const boot = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(boot);
  }, [load, router]);

  return (
    <AppFrame className="courier-screen">
      <ScreenHeader
        title="Your account"
        subtitle="Ready for every delivery"
        backHref="/home/"
      />
      {!ready ? (
        <div className="grid min-h-64 place-items-center">
          <Spinner />
        </div>
      ) : null}
      {error ? (
        <div className="space-y-3 mb-5">
          <ErrorBanner message={error} />
          <Button variant="secondary" onPress={() => void load()}>
            Try again
          </Button>
        </div>
      ) : null}
      {profile ? (
        <>
          <section className="courier-hero">
            <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <ShieldCheck size={24} />
            </span>
            <h1 className="text-2xl font-semibold">Courier profile</h1>
            <p className="mt-2 text-sm text-muted">
              {profile.isActive
                ? "Approved courier account"
                : "Account awaiting activation"}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span
                className="courier-status-dot"
                data-active={profile.onDuty}
              />
              {profile.onDuty
                ? "On duty · live location enabled"
                : "Off duty · location sharing paused"}
            </div>
          </section>
          <VehicleProfile profile={profile} onSaved={setProfile} />
          <section className="courier-card space-y-4 mb-5">
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted">
              Choose the most comfortable view for your shift.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={resolvedTheme === "light" ? "primary" : "secondary"}
                aria-pressed={resolvedTheme === "light"}
                onPress={() => setTheme("light")}
              >
                <Sun size={18} /> Light
              </Button>
              <Button
                variant={resolvedTheme === "dark" ? "primary" : "secondary"}
                aria-pressed={resolvedTheme === "dark"}
                onPress={() => setTheme("dark")}
              >
                <Moon size={18} /> Dark
              </Button>
            </div>
          </section>
          <section className="courier-card mb-5">
            <h2 className="font-semibold mb-3">Delivery notifications</h2>
            <Notifications accessToken={getCourierToken()} />
          </section>
          <Link
            href="/earnings/"
            className="courier-card courier-card--interactive flex items-center gap-3 mb-5"
          >
            <WalletCards className="text-accent" size={24} />
            <span>
              <strong className="block">Your earnings</strong>
              <span className="text-sm text-muted">
                Statements and settlements
              </span>
            </span>
          </Link>
          <section className="courier-card space-y-3">
            <h2 className="font-semibold">Location & privacy</h2>
            <p className="text-sm text-muted">
              Location is shared during an active shift so dispatch and
              customers can follow deliveries. End your shift from Home to stop
              sharing.
            </p>
            {profile.onDuty ? (
              <Link
                href="/home/"
                className="inline-block text-sm font-semibold underline"
              >
                Return to your shift
              </Link>
            ) : null}
            <Button
              variant="secondary"
              fullWidth
              isDisabled={profile.onDuty}
              onPress={() => {
                clearCourierToken();
                router.replace("/login/");
              }}
            >
              <LogOut size={18} /> Sign out
            </Button>
            {profile.onDuty ? (
              <p className="text-xs text-muted">
                Finish your shift before signing out.
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </AppFrame>
  );
}
