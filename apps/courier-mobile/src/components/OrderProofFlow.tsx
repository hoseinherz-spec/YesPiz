"use client";
import { FormScope, FormAction } from "@repo/ui/forms";
import { OrderChat } from "@repo/api/components/order-chat";
import { ScanCode } from "@/components/ScanCode";
import { ProofUpload } from "@repo/api/components/proof-upload";

import {
  incidentsClient,
  proofClient,
  type Incident,
  type OrderStatus,
} from "@repo/api";
import { Button, Spinner, Typography } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, MapPin, Navigation } from "lucide-react";

import { IncidentActionSheet } from "@/components/IncidentActionSheet";
import { ErrorBanner, ProofField } from "@/components/ProofUi";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useActiveLocationSharing } from "@/hooks/use-active-location";
import { formatApiError } from "@/lib/api-errors";
import { requireCourierToken } from "@/lib/auth";
import { getCourierToken } from "@/lib/auth";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import {
  type CourierOrderProofView,
  formatOrderStatus,
  isActiveDeliveryStatus,
  parseCourierProofView,
} from "@/lib/courier-proof";
import { cn } from "@/lib/cn";
import { getCurrentPosition, GeoError } from "@/lib/geolocation";
import { hx } from "@/lib/heroui-classes";

type OrderProofFlowProps = {
  orderId: string;
  batchId?: string;
  backHref: string;
};

export function OrderProofFlow({
  orderId,
  batchId,
  backHref,
}: OrderProofFlowProps) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<CourierOrderProofView | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);

  const [pickupCode, setPickupCode] = useState("");
  const [sealId, setSealId] = useState("");
  const [doorPin, setDoorPin] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [cashEuros, setCashEuros] = useState("");
  const [bagChecked, setBagChecked] = useState(false);
  const [itemsChecked, setItemsChecked] = useState(false);

  const shareLocation = isActiveDeliveryStatus(view?.status ?? "DRAFT");
  const {
    lastPosted,
    error: locError,
    postOnce,
  } = useActiveLocationSharing(false);

  const load = useCallback(async () => {
    const token = requireCourierToken();
    const [proofRes, mine] = await Promise.all([
      proofClient
        .get(orderId, { accessToken: token })
        .then(parseCourierProofView),
      incidentsClient.listMine({ accessToken: token }),
    ]);
    setView(proofRes);
    setCashEuros((current) => current || (proofRes.totalCents / 100).toFixed(2));
    setIncidents(mine);
    if (proofRes.sealId) setSealId((current) => current || proofRes.sealId || "");
  }, [orderId]);

  useLiveRefresh(getCourierToken(), undefined, load);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
        .then(() => setReady(true))
        .catch((err) => {
          setError(formatApiError(err, "Failed to load order"));
          setReady(true);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function withGeo<T>(
    action: (coords: { longitude: number; latitude: number }) => Promise<T>,
  ) {
    setBusy(true);
    setError(null);
    try {
      // Custody proof must use the current stop, never a cached previous location.
      const coords = await getCurrentPosition({ maximumAgeMs: 0 });
      const result = await action(coords);
      await load();
      return result;
    } catch (err) {
      if (err instanceof GeoError) setError(err.message);
      else setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handlePickup() {
    if (busy) return;
    if (!/^\d{6}$/.test(pickupCode.trim()) || !bagChecked || !itemsChecked) {
      setError("Check the sealed bag and order label, then enter the six-digit pickup code.");
      return;
    }
    await withGeo(async (coords) => {
      const token = requireCourierToken();
      return proofClient.pickup(
        orderId,
        {
          code: pickupCode.trim(),
          sealId: sealId.trim() || undefined,
          ...coords,
        },
        { accessToken: token },
      );
    });
  }

  async function handleEnRoute() {
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      let body = {};
      try {
        body = await getCurrentPosition();
      } catch {
        // en-route allows optional coords
      }
      await proofClient.markEnRoute(orderId, body, { accessToken: token });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeliver() {
    if (busy) return;
    if (doorPin.trim() && !/^\d{4}$/.test(doorPin.trim())) {
      setError("The customer PIN must contain four digits.");
      return;
    }
    const hasProof = doorPin.trim() || signatureUrl.trim() || photoUrl.trim();
    if (!hasProof) {
      setError("Enter the door PIN or upload delivery proof.");
      return;
    }
    await withGeo(async (coords) => {
      const token = requireCourierToken();
      return proofClient.deliver(
        orderId,
        {
          pin: doorPin.trim() || undefined,
          signatureUrl: signatureUrl.trim() || undefined,
          photoUrl: photoUrl.trim() || undefined,
          ...coords,
        },
        { accessToken: token },
      );
    });
  }

  async function handleCashReceipt() {
    const amount = cashEuros.trim().replace(",", ".");
    const cents = Math.round(Number(amount) * 100);
    if (
      !/^\d+(\.\d{1,2})?$/.test(amount) ||
      !Number.isSafeInteger(cents) ||
      cents !== view?.totalCents
    ) {
      setError(
        "Record the exact order total in euros after giving any change.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      await proofClient.cashReceipt(
        orderId,
        { amountCents: cents },
        { accessToken: token },
      );
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      await proofClient.complete(orderId, { accessToken: token });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleIncidentReport(payload: {
    kind: Parameters<typeof incidentsClient.report>[1]["kind"];
    notes: string;
    longitude?: number;
    latitude?: number;
  }) {
    const token = requireCourierToken();
    const created = await incidentsClient.report(orderId, payload, {
      accessToken: token,
    });
    setIncidents((prev) => [created, ...prev]);
    await load();
    return created;
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const status = view?.status ?? "DRAFT";
  const paymentMethod = view?.paymentMethod ?? "card";
  const proof = view?.proof;
  const needsCashReceipt =
    paymentMethod === "cash" &&
    status === "DELIVERED" &&
    proof?.cashReceiptAt == null;
  const canComplete =
    status === "DELIVERED" &&
    (paymentMethod !== "cash" || proof?.cashReceiptAt != null);

  return (
    <>
      <ScreenHeader
        title={`Order`}
        subtitle={formatOrderStatus(status)}
        backHref={backHref}
        right={
          <Button
            isIconOnly
            variant="secondary"
            aria-label="Report an incident"
            className="courier-icon-button border-0"
            onPress={() => setIncidentOpen(true)}
          >
            <AlertTriangle size={18} />
          </Button>
        }
      />

      <p className={cn(hx.caption, "mb-4 font-mono")}>{orderId}</p>
      {batchId ? (
        <p className={cn(hx.caption, "mb-4")}>Batch {batchId}</p>
      ) : null}

      {view ? (
        <section className="courier-card mb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-tertiary text-accent">
              <MapPin size={21} />
            </span>
            <h2 className={hx.title}>
              {status === "ASSIGNED_TO_COURIER" ? "Pickup" : "Delivery address"}
            </h2>
          </div>
          {status === "ASSIGNED_TO_COURIER" ? (
            <p className="mt-2">{view.pickup?.address}</p>
          ) : (
            <>
              <p className="mt-2">
                {[view.deliveryStreet, view.deliveryZipcode, view.deliveryCity]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>
                {[
                  view.deliveryEntrance && `Entrance ${view.deliveryEntrance}`,
                  view.deliveryFloor && `Floor ${view.deliveryFloor}`,
                  view.deliveryUnit && `Unit ${view.deliveryUnit}`,
                  view.deliveryDoorCode && `Door code ${view.deliveryDoorCode}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-2">{view.deliveryInstructions}</p>
              {view.leaveAtDoor ? (
                <p>
                  Leave at the door after collecting delivery proof
                  {paymentMethod === "cash" ? " and payment" : ""}.
                </p>
              ) : null}
            </>
          )}
          <p className="mt-3 font-semibold">
            {paymentMethod === "cash" ? "Collect cash" : "Paid by card"} · €
            {(view.totalCents / 100).toFixed(2)}
          </p>
          {(() => {
            const lat =
              status === "ASSIGNED_TO_COURIER"
                ? view.pickup?.latitude
                : view.deliveryLatitude;
            const lng =
              status === "ASSIGNED_TO_COURIER"
                ? view.pickup?.longitude
                : view.deliveryLongitude;
            return lat != null && lng != null ? (
              <a
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={16} /> Open directions
              </a>
            ) : null;
          })()}
        </section>
      ) : null}
      {error ? <ErrorBanner message={error} className="mb-4" /> : null}
      {locError ? <ErrorBanner message={locError} className="mb-4" /> : null}

      {shareLocation ? (
        <section className="courier-card mb-4">
          <Typography type="h3" className={hx.title}>
            Live location
          </Typography>
          <p className={cn(hx.bodySm, "mt-1")}>
            Your active shift shares your location with dispatch and the customer. Keep location permission enabled.
          </p>
          {lastPosted ? (
            <p className={cn(hx.caption, "mt-2")}>Last: {lastPosted}</p>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 h-10 rounded-full"
            onPress={() => void postOnce()}
          >
            Post now
          </Button>
        </section>
      ) : null}

      <StatusStep status={status} />

      {status === "ASSIGNED_TO_COURIER" ? (
        <FormScope>
          <section className={cn(hx.card, "mt-4 flex flex-col gap-3")}>
            <Typography type="h3" className={hx.title}>
              Pickup at kitchen
            </Typography>
            <p className={hx.bodySm}>
              Enter the pickup QR/OTP from the counter, confirm the numbered
              seal, and capture your location.
            </p>
            {view?.sealId ? (
              <p className={hx.caption}>Expected seal: {view.sealId}</p>
            ) : null}
            <ScanCode onScan={setPickupCode} />
            <fieldset className="rounded-2xl bg-surface-tertiary p-4 space-y-3" disabled={busy}>
              <legend className="sr-only">Kitchen handoff checks</legend>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1 size-4 accent-current" checked={itemsChecked} onChange={(event) => setItemsChecked(event.target.checked)} />
                <span>Order label and number of bags match this order.</span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1 size-4 accent-current" checked={bagChecked} onChange={(event) => setBagChecked(event.target.checked)} />
                <span>Packaging is secure and the seal is intact.</span>
              </label>
            </fieldset>
            <ProofField
              label="Pickup code"
              required
              pattern="[0-9]{6}"
              value={pickupCode}
              onChange={setPickupCode}
              placeholder="6-digit code"
              inputMode="numeric"
              maxLength={6}
              hint="Scan the counter code or enter its six digits."
            />
            <ProofField
              label="Seal ID"
              maxLength={100}
              value={sealId}
              onChange={setSealId}
              placeholder="Seal number on bag"
            />
            <FormAction
              variant="primary"
              fullWidth
              isDisabled={busy || !/^\d{6}$/.test(pickupCode.trim()) || !bagChecked || !itemsChecked}
              onPress={() => void handlePickup()}
              className={cn(hx.btnPrimary, "h-14 text-base")}
            >
              Confirm pickup
            </FormAction>
          </section>
        </FormScope>
      ) : null}

      {status === "PICKED_UP" ? (
        <section className={cn(hx.card, "mt-4 flex flex-col gap-3")}>
          <Typography type="h3" className={hx.title}>
            Start delivery
          </Typography>
          <p className={hx.bodySm}>Mark en route when leaving the provider.</p>
          <Button
            variant="primary"
            fullWidth
            isDisabled={busy}
            onPress={() => void handleEnRoute()}
            className={cn(hx.btnPrimary, "h-14 text-base")}
          >
            Mark en route
          </Button>
        </section>
      ) : null}

      {shareLocation && (
        <>
          <details className="mb-4 rounded-3xl border border-border p-4">
            <summary className="cursor-pointer font-semibold">
              Kitchen pickup chat
            </summary>
            <div className="pt-3">
              <OrderChat
                orderId={orderId}
                accessToken={requireCourierToken()}
                channel="kitchen"
              />
            </div>
          </details>
          <OrderChat orderId={orderId} accessToken={requireCourierToken()} />
        </>
      )}
      {status === "ON_THE_WAY" ? (
        <FormScope>
          <section className={cn(hx.card, "mt-4 flex flex-col gap-3")}>
            <Typography type="h3" className={hx.title}>
              Deliver to customer
            </Typography>
              <p className={hx.bodySm}>
              Enter the customer PIN or capture proof of delivery.
            </p>
            {view?.hasDoorPin ? (
              <ProofField
                label="Door PIN"
                pattern="[0-9]{4}"
                value={doorPin}
                onChange={setDoorPin}
                placeholder="4-digit PIN"
                inputMode="numeric"
                maxLength={4}
              />
            ) : null}
            <ProofUpload
              orderId={orderId}
              accessToken={requireCourierToken()}
              purpose="signature"
              onUploaded={setSignatureUrl}
            />
            <ProofUpload
              orderId={orderId}
              accessToken={requireCourierToken()}
              purpose="dropoff"
              onUploaded={setPhotoUrl}
            />
            <FormAction
              variant="primary"
              fullWidth
              isDisabled={busy || !(doorPin.trim() || signatureUrl || photoUrl)}
              onPress={() => void handleDeliver()}
              className={cn(hx.btnPrimary, "h-14 text-base")}
            >
              Confirm delivery
            </FormAction>
          </section>
        </FormScope>
      ) : null}

      {needsCashReceipt ? (
        <FormScope>
          <section className={cn(hx.card, "mt-4 flex flex-col gap-3")}>
            <Typography type="h3" className={hx.title}>
              Cash receipt
            </Typography>
            <p className={hx.bodySm}>
              Record cash collected before completing this order.
            </p>
            <ProofField
              label="Amount received (€)"
              required
              type="number"
              min={0}
              step="0.01"
              value={cashEuros}
              onChange={setCashEuros}
              placeholder="e.g. 24.99"
              inputMode="decimal"
            />
            <FormAction
              variant="primary"
              fullWidth
              isDisabled={busy || !cashEuros.trim()}
              onPress={() => void handleCashReceipt()}
              className={cn(hx.btnPrimary, "h-14 text-base")}
            >
              Record cash receipt
            </FormAction>
          </section>
        </FormScope>
      ) : null}

      {canComplete ? (
        <section className={cn(hx.card, "mt-4 flex flex-col gap-3")}>
          <Typography type="h3" className={hx.title}>
            Complete order
          </Typography>
          <Button
            variant="primary"
            fullWidth
            isDisabled={busy}
            onPress={() => void handleComplete()}
            className={cn(hx.btnPrimary, "h-14 text-base")}
          >
            Mark completed
          </Button>
        </section>
      ) : null}

      {status === "COMPLETED" ? (
        <section className={cn(hx.card, "mt-4")}>
          <Typography type="h3" className={hx.title}>
            Delivery complete
          </Typography>
          <p className={cn(hx.bodySm, "mt-2")}>
            Proof chain finished. Return to batch or take the next stop.
          </p>
        </section>
      ) : null}

      {status === "EXCEPTION_REPORTED" ? (
        <section
          className={cn(hx.card, "mt-4 border-danger/30 bg-danger-soft")}
        >
          <Typography type="h3" className="text-danger">
            Exception reported
          </Typography>
          <p className={cn(hx.bodySm, "mt-2 text-danger")}>
            Operations is handling this order. Check incident workflows below.
          </p>
        </section>
      ) : null}

      {proof?.pickupAt ? (
        <section className={cn(hx.card, "mt-4")}>
          <Typography type="h3" className={hx.title}>
            Custody log
          </Typography>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {(proof.custodyLog ?? []).map((ev, i) => {
              const label =
                ("event" in ev && typeof ev.event === "string"
                  ? ev.event
                  : null) ??
                ev.kind ??
                "event";
              return (
                <li key={`${ev.at}-${i}`} className="text-muted">
                  {new Date(ev.at).toLocaleTimeString()} —{" "}
                  {label.replaceAll("_", " ")}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <IncidentActionSheet
        open={incidentOpen}
        orderId={orderId}
        onClose={() => setIncidentOpen(false)}
        onReport={handleIncidentReport}
        existing={incidents}
      />
    </>
  );
}

const STEPS: OrderStatus[] = [
  "ASSIGNED_TO_COURIER",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "COMPLETED",
];

function StatusStep({ status }: { status: OrderStatus }) {
  const idx = STEPS.indexOf(status);
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, i) => {
        const done = idx >= 0 && i <= idx;
        const active = step === status;
        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold capitalize",
              done
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-card text-muted",
              active && "ring-2 ring-accent",
            )}
          >
            {formatOrderStatus(step)}
          </li>
        );
      })}
    </ol>
  );
}
