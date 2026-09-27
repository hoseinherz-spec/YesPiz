"use client";
import { FormAction, FormScope, Input } from "@repo/ui/forms";

import {
  ApiError,
  dispatchClient,
  providersClient,
  type ProviderOffer,
  type WaveRespondResponse,
} from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { getProviderToken, requireProviderToken } from "@/lib/auth";
import { formatCents } from "@/lib/ids";
import { useLiveRefresh } from "@/lib/use-live-refresh";

type WaveOutcome = {
  orderId: string;
  label: string;
  at: number;
};

type OfferWaveState = {
  respondedAt?: string;
  awaitingResponses?: number;
  outcome?: "waiting" | "won" | "lost" | "rejected" | "expired";
};

function secondsLeft(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

function formatCountdown(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds <= 0) return "Window closed";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function outcomeFromResponse(
  res: WaveRespondResponse,
  selfProviderId: string,
): OfferWaveState["outcome"] {
  if (res.awaitingResponses && res.awaitingResponses > 0) return "waiting";
  if (res.providerId) {
    return res.providerId === selfProviderId ? "won" : "lost";
  }
  if (res.status === "ACCEPTED_BY_PROVIDER") return "won";
  return "waiting";
}

export default function OffersPage() {
  const [offers, setOffers] = useState<ProviderOffer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [prepByOrder, setPrepByOrder] = useState<Record<string, string>>({});
  const [waveByOrder, setWaveByOrder] = useState<
    Record<string, OfferWaveState>
  >({});
  const [recentOutcomes, setRecentOutcomes] = useState<WaveOutcome[]>([]);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const [profile, list] = await Promise.all([
        providersClient.getMeProfile({ accessToken: token }),
        dispatchClient.listOffers({ accessToken: token }),
      ]);
      const pid = profile.id ?? String((profile as { _id?: string })._id ?? "");
      setProviderId(pid);
      setOffers(list);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load offers");
    }
  }, []);

  useLiveRefresh(
    getProviderToken(),
    providerId ? `provider:${providerId}` : undefined,
    load,
  );

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    const poll = window.setInterval(() => {
      if (!document.hidden) load().catch(() => undefined);
    }, 8000);
    const countdown = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(poll);
      window.clearInterval(countdown);
    };
  }, [load]);

  useEffect(() => {
    const acknowledge = () => {
      if (document.hidden) return;
      const token = getProviderToken();
      if (!token) return;
      for (const offer of offers)
        void dispatchClient
          .markViewed(offer.orderId, { accessToken: token })
          .catch(() => undefined);
    };
    acknowledge();
    document.addEventListener("visibilitychange", acknowledge);
    return () => document.removeEventListener("visibilitychange", acknowledge);
  }, [offers]);

  function recordOutcome(orderId: string, label: string) {
    setRecentOutcomes((prev) => {
      const filtered = prev.filter((o) => o.orderId !== orderId);
      return [{ orderId, label, at: Date.now() }, ...filtered].slice(0, 8);
    });
  }

  async function respondReady(orderId: string) {
    const raw = prepByOrder[orderId] ?? "20";
    const quotedPrepMinutes = Number(raw);
    if (!Number.isSafeInteger(quotedPrepMinutes) || quotedPrepMinutes < 5) {
      setError("Enter a whole number of at least 5 minutes for preparation.");
      return;
    }

    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      const res = await dispatchClient.respond(
        orderId,
        { ready: true, quotedPrepMinutes },
        { accessToken: token },
      );
      const outcome = providerId
        ? outcomeFromResponse(res, providerId)
        : "waiting";
      setWaveByOrder((prev) => ({
        ...prev,
        [orderId]: {
          respondedAt: new Date().toISOString(),
          awaitingResponses: res.awaitingResponses,
          outcome,
        },
      }));
      if (outcome === "won") {
        recordOutcome(orderId, "You won this wave");
      } else if (outcome === "lost") {
        recordOutcome(orderId, "Another kitchen won");
      } else {
        recordOutcome(
          orderId,
          `Bid submitted — waiting on ${res.awaitingResponses ?? 0} kitchen(s)`,
        );
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Response failed");
    } finally {
      setBusyId(null);
    }
  }

  async function respondReject(orderId: string) {
    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      await dispatchClient.respond(
        orderId,
        { ready: false },
        { accessToken: token },
      );
      setWaveByOrder((prev) => ({
        ...prev,
        [orderId]: {
          respondedAt: new Date().toISOString(),
          outcome: "rejected",
        },
      }));
      recordOutcome(orderId, "Declined offer");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  void tick;

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography type="h1" className="text-2xl font-semibold">
                Offers inbox
              </Typography>
              <p className="text-muted text-sm">
                Confirm your preparation time. Accepted orders appear on the
                kitchen board once your kitchen is selected.
              </p>
            </div>
            <Button size="sm" variant="secondary" onPress={load}>
              Refresh
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}

          {recentOutcomes.length ? (
            <Card className="p-4">
              <Card.Content className="flex flex-col gap-2 p-0">
                <Typography type="h3" className="text-sm font-medium">
                  Recent wave outcomes
                </Typography>
                <ul className="text-muted space-y-1 text-xs">
                  {recentOutcomes.map((o) => (
                    <li key={`${o.orderId}-${o.at}`}>
                      {o.label} · order {o.orderId.slice(-8)}
                    </li>
                  ))}
                </ul>
              </Card.Content>
            </Card>
          ) : null}

          {!loaded && !error && (
            <p role="status" className="panel-notice">
              Checking for incoming orders…
            </p>
          )}
          {loaded && !offers.length ? (
            <Card className="p-4">
              <Card.Content className="text-muted p-0 text-sm">
                No pending offers
              </Card.Content>
            </Card>
          ) : null}

          {offers.map((offer) => {
            const wave = waveByOrder[offer.orderId];
            const responded = Boolean(offer.respondedAt ?? wave?.respondedAt);
            const expired = secondsLeft(offer.expiresAt) === 0;
            const countdown = formatCountdown(secondsLeft(offer.expiresAt));
            const outcomeLabel =
              wave?.outcome === "won"
                ? "You won — check Kitchen"
                : wave?.outcome === "lost"
                  ? "Lost — another kitchen selected"
                  : wave?.outcome === "rejected"
                    ? "You declined"
                    : responded
                      ? `Waiting (${wave?.awaitingResponses ?? "…"} kitchens left)`
                      : null;

            return (
              <Card key={offer.orderId} className="p-4">
                <FormScope>
                  <Card.Content className="flex flex-col gap-2 p-0">
                    <div className="flex flex-wrap justify-between gap-2">
                      <Typography type="h3" className="font-medium">
                        {formatCents(offer.totalCents)}
                      </Typography>
                      <span className="text-muted text-xs">
                        score {offer.score?.toFixed?.(2) ?? offer.score ?? "—"}
                      </span>
                    </div>
                    <p className="text-muted text-xs">Order {offer.orderId}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span>Bid window: {countdown}</span>
                      {offer.wave ? (
                        <span className="text-muted">Wave offer</span>
                      ) : null}
                    </div>
                    {outcomeLabel ? (
                      <p className="text-sm font-medium">{outcomeLabel}</p>
                    ) : null}
                    <ul className="text-sm">
                      {offer.lines.map((line, idx) => (
                        <li key={`${offer.orderId}-${idx}`}>
                          {line.quantity}× {line.name} ·{" "}
                          {line.selectionLabels?.length
                            ? line.selectionLabels.join(" · ")
                            : (line.size ?? "medium")}
                          {line.extras?.length
                            ? ` · ${line.extras.join(", ")}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                    {!responded ? (
                      <>
                        <Input
                          label={
                            <>
                              <span className="text-muted">
                                Quoted prep (minutes, min 5)
                              </span>
                            </>
                          }
                          wrapperClassName="flex flex-col gap-1 text-sm"
                          type="number"
                          min={5}
                          step={1}
                          value={prepByOrder[offer.orderId] ?? "20"}
                          onChange={(e) =>
                            setPrepByOrder((prev) => ({
                              ...prev,
                              [offer.orderId]: e.target.value,
                            }))
                          }
                          className="border-border bg-background max-w-[8rem] rounded-md border px-3 py-2"
                        />
                        <div className="flex gap-2 pt-1">
                          <FormAction
                            variant="primary"
                            size="sm"
                            isDisabled={busyId !== null || expired}
                            onPress={() => respondReady(offer.orderId)}
                          >
                            Declare ready
                          </FormAction>
                          <Button
                            variant="secondary"
                            size="sm"
                            isDisabled={busyId !== null || expired}
                            onPress={() => respondReject(offer.orderId)}
                          >
                            Decline
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted text-sm">
                        Response recorded
                        {offer.quotedPrepMinutes != null
                          ? ` · ${offer.quotedPrepMinutes} min prep quoted`
                          : ""}
                      </p>
                    )}
                  </Card.Content>
                </FormScope>
              </Card>
            );
          })}
        </div>
      }
    </FormScope>
  );
}
