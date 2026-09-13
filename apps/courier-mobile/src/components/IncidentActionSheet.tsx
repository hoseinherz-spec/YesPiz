"use client";
import { FormScope, FormAction } from "@repo/ui/forms";
import { ProofUpload } from "@repo/api/components/proof-upload";
import { requireCourierToken } from "@/lib/auth";

import type { Incident, IncidentKind } from "@repo/api";
import { Button, Typography } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";

import { ErrorBanner, ProofField } from "@/components/ProofUi";
import { formatApiError } from "@/lib/api-errors";
import { cn } from "@/lib/cn";
import { getCurrentPosition } from "@/lib/geolocation";
import { hx } from "@/lib/heroui-classes";

export const INCIDENT_KINDS: {
  kind: IncidentKind;
  label: string;
  description: string;
  needsAmount?: boolean;
  needsPhoto?: boolean;
}[] = [
  {
    kind: "crash",
    label: "Crash",
    description: "Vehicle collision — stop safely and report to operations.",
  },
  {
    kind: "no_answer",
    label: "No answer",
    description: "Customer not responding — 5 minute wait timer starts.",
  },
  {
    kind: "no_pay",
    label: "No payment",
    description: "Customer refused cash — debt path, cannot complete.",
  },
  {
    kind: "wrong_address",
    label: "Wrong address",
    description: "Delivery location does not match the order.",
  },
  {
    kind: "damaged_pack",
    label: "Damaged package",
    description: "Seal broken or food damaged — photo evidence required.",
    needsPhoto: true,
  },
  {
    kind: "vehicle",
    label: "Vehicle problem",
    description: "Breakdown or mechanical issue — safe stop and reassign.",
  },
  {
    kind: "sos",
    label: "SOS",
    description: "Emergency — alert operations with your available location.",
  },
];

type IncidentActionSheetProps = {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onReport: (payload: {
    kind: IncidentKind;
    notes: string;
    longitude?: number;
    latitude?: number;
  }) => Promise<Incident>;
  existing?: Incident[];
};

function workflowSteps(incident: Incident): string[] {
  const wf = incident.workflow as {
    steps?: string[];
    currentStep?: string;
    waitUntil?: string;
    sos?: boolean;
  };
  return wf.steps ?? [];
}

function workflowMeta(incident: Incident, now: number): string | null {
  const wf = incident.workflow as {
    currentStep?: string;
    waitUntil?: string;
    debtCents?: number;
    sos?: boolean;
  };
  const parts: string[] = [];
  if (wf.currentStep)
    parts.push(`Step: ${wf.currentStep.replaceAll("_", " ")}`);
  if (wf.waitUntil) {
    const remaining = Math.max(
      0,
      Math.ceil((new Date(wf.waitUntil).getTime() - now) / 1000),
    );
    if (Number.isFinite(remaining))
      parts.push(
        remaining > 0
          ? `Wait ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} remaining`
          : "Wait finished — retry customer contact and contact operations for next steps",
      );
  }
  if (wf.debtCents != null)
    parts.push(`Debt: €${(wf.debtCents / 100).toFixed(2)}`);
  if (wf.sos) parts.push("SOS — reported to operations");
  return parts.length ? parts.join(" · ") : null;
}

export function IncidentActionSheet({
  open,
  orderId,
  onClose,
  onReport,
  existing = [],
}: IncidentActionSheetProps) {
  const [selected, setSelected] = useState<
    (typeof INCIDENT_KINDS)[number] | null
  >(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [open]);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const reset = useCallback(() => {
    setSelected(null);
    setNotes("");
    setPhotoUrl("");
    setError(null);
    setCoords(null);
  }, []);

  function closeSheet() {
    if (busy) return;
    reset();
    onClose();
  }

  useEffect(() => {
    if (!open || !selected?.kind) return;
    let cancelled = false;
    void getCurrentPosition()
      .then((pos) => {
        if (!cancelled) setCoords(pos);
      })
      .catch(() => {
        // location optional for some kinds; SOS will surface error on submit
      });
    return () => {
      cancelled = true;
    };
  }, [open, selected?.kind]);

  async function submit() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      // Use the location already requested when the sheet opened. A pending
      // permission prompt must not delay sending an emergency report.
      const longitude = coords?.longitude;
      const latitude = coords?.latitude;
      const noteParts = [notes.trim()];
      if (selected.kind === "sos" && (longitude == null || latitude == null)) {
        noteParts.push(
          "GPS unavailable. Operations: confirm the courier location directly.",
        );
      }
      if (selected.needsPhoto && photoUrl.trim()) {
        noteParts.push(`photo:${photoUrl.trim()}`);
      }
      await onReport({
        kind: selected.kind,
        notes: noteParts.filter(Boolean).join("\n"),
        longitude,
        latitude,
      });
      reset();
      onClose();
    } catch (err) {
      setError(formatApiError(err, "Could not report incident"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const orderIncidents = existing.filter(
    (i) =>
      String(i.orderId) === orderId &&
      i.status !== "resolved" &&
      i.status !== "cancelled",
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40">
      <Button
        variant="ghost"
        type="button"
        aria-label="Close incident sheet"
        className="min-h-0 flex-1"
        onPress={closeSheet}
      />
      <div className={cn(hx.sheet, "max-h-[85dvh] overflow-y-auto")}>
        <Typography type="h3" className={hx.title}>
          Report incident
        </Typography>
        <p className={cn(hx.bodySm, "mt-1")}>Order {orderId}</p>

        {error ? <ErrorBanner message={error} className="mt-4" /> : null}

        {selected?.kind === "sos" ? (
          <div className="mt-4 rounded-[18px] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            <strong>Emergency SOS</strong>
            <p className="mt-1">
              Send SOS to alert operations. Your location will be included when
              available; GPS failure will not block your report.
            </p>
            {coords ? (
              <p className="mt-2 font-mono text-xs">
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </p>
            ) : null}
          </div>
        ) : null}

        {!selected ? (
          <ul className="mt-4 flex flex-col gap-2">
            {INCIDENT_KINDS.map((item) => (
              <li key={item.kind}>
                <Button
                  variant="ghost"
                  type="button"
                  className={cn(
                    hx.card,
                    "w-full text-left transition-opacity hover:opacity-90",
                  )}
                  onPress={() => setSelected(item)}
                >
                  <span className={hx.title}>{item.label}</span>
                  <p className={cn(hx.caption, "mt-1")}>{item.description}</p>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <FormScope>
            <div className="mt-4 flex flex-col gap-4">
              <p className={hx.bodySm}>{selected.description}</p>
              <ProofField
                label="Notes"
                maxLength={2000}
                value={notes}
                onChange={setNotes}
                placeholder="What happened?"
              />
              {selected.needsPhoto ? (
                <ProofUpload
                  orderId={orderId}
                  accessToken={requireCourierToken()}
                  purpose="incident"
                  onUploaded={setPhotoUrl}
                />
              ) : null}
              {coords ? (
                <p className={hx.caption}>
                  Location: {coords.latitude.toFixed(5)},{" "}
                  {coords.longitude.toFixed(5)}
                </p>
              ) : (
                <p className={hx.caption}>
                  Fetching location… allow GPS if prompted.
                </p>
              )}
              <div className="flex flex-col gap-2">
                <FormAction
                  variant="primary"
                  fullWidth
                  isDisabled={busy || (selected.needsPhoto && !photoUrl.trim())}
                  onPress={() => void submit()}
                  className={cn(
                    selected.kind === "sos"
                      ? "bg-danger text-white"
                      : hx.btnPrimary,
                    "h-14 text-base",
                  )}
                >
                  {busy
                    ? "Reporting…"
                    : selected.kind === "sos"
                      ? "Send SOS"
                      : "Submit report"}
                </FormAction>
                <Button
                  variant="secondary"
                  fullWidth
                  isDisabled={busy}
                  onPress={() => setSelected(null)}
                  className={cn(hx.btnSecondary, "h-12 text-base")}
                >
                  Back
                </Button>
              </div>
            </div>
          </FormScope>
        )}

        {orderIncidents.length ? (
          <section className="mt-6 border-t border-border pt-4">
            <Typography type="h3" className={hx.title}>
              Active workflows
            </Typography>
            <ul className="mt-2 flex flex-col gap-2">
              {orderIncidents.map((inc) => (
                <li key={inc.id} className={cn(hx.card, "p-3")}>
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold capitalize">
                      {inc.kind.replaceAll("_", " ")}
                    </span>
                    <span className={hx.caption}>{inc.status}</span>
                  </div>
                  {inc.notes ? (
                    <p className={cn(hx.bodySm, "mt-1")}>{inc.notes}</p>
                  ) : null}
                  {workflowMeta(inc, now) ? (
                    <p className={cn(hx.caption, "mt-1")}>
                      {workflowMeta(inc, now)}
                    </p>
                  ) : null}
                  <ul className="mt-2 list-inside list-disc text-xs text-muted">
                    {workflowSteps(inc).map((step) => (
                      <li key={step}>{step.replaceAll("_", " ")}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
