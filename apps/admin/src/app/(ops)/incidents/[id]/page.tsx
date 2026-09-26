"use client";
import {
  FormAction,
  FormScope,
  TextArea,
  Input,
} from "@/components/AdminForms";

import { MediaPreview } from "@repo/api/components/media-preview";

import {
  ApiError,
  incidentsClient,
  type Incident,
  type IncidentKind,
} from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
import { entityId } from "@/lib/ids";
import { useLoadOnMount } from "@/lib/load-on-mount";

function kindLabel(kind: IncidentKind): string {
  return kind.replace(/_/g, " ");
}

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const incidentId = params.id;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [resolveNotes, setResolveNotes] = useState("");
  const [replacementCourierId, setReplacementCourierId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const doc = await incidentsClient.get(incidentId, { accessToken: token });
      setIncident(doc);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load incident",
      );
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useLoadOnMount(() => {
    void load();
  });

  async function resolve(status: "resolved" | "cancelled") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = requireAdminToken();
      const updated = await incidentsClient.resolve(
        incidentId,
        {
          status,
          notes: resolveNotes.trim() || undefined,
          replacementCourierId: replacementCourierId.trim() || undefined,
        },
        { accessToken: token },
      );
      setIncident(updated);
      setMessage(
        status === "resolved" ? "Incident resolved." : "Incident cancelled.",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Resolve failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-muted text-sm">Loading…</p>;
  }

  if (!incident) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-danger">{error ?? "Incident not found"}</p>
        <Link href="/incidents" className="text-sm underline">
          Back to queue
        </Link>
      </div>
    );
  }

  const workflow = incident.workflow as {
    steps?: string[];
    currentStep?: string;
    waitUntil?: string;
    startedAt?: string;
    debtCents?: number;
    sos?: boolean;
  };
  const isClosed =
    incident.status === "resolved" || incident.status === "cancelled";

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div>
            <Link
              href="/incidents"
              className="text-muted text-sm hover:underline"
            >
              ← Incident queue
            </Link>
            <Typography
              type="h1"
              className="mt-2 text-2xl font-semibold capitalize"
            >
              {kindLabel(incident.kind)}
            </Typography>
            <p className="text-muted text-sm">
              {incident.status} · ID {entityId(incident)}
            </p>
          </div>

          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          {message ? <p className="text-sm text-success">{message}</p> : null}

          <Card className="p-4">
            <Card.Content className="flex flex-col gap-2 p-0">
              <Typography type="h3" className="font-medium">
                Context
              </Typography>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Order</dt>
                  <dd className="font-mono text-xs">{incident.orderId}</dd>
                </div>
                <div>
                  <dt className="text-muted">Courier</dt>
                  <dd className="font-mono text-xs">{incident.courierId}</dd>
                </div>
                {incident.batchId ? (
                  <div>
                    <dt className="text-muted">Batch</dt>
                    <dd className="font-mono text-xs">{incident.batchId}</dd>
                  </div>
                ) : null}
                {incident.createdAt ? (
                  <div>
                    <dt className="text-muted">Reported</dt>
                    <dd>{new Date(incident.createdAt).toLocaleString()}</dd>
                  </div>
                ) : null}
                {incident.longitude != null && incident.latitude != null ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted">Location</dt>
                    <dd>
                      {incident.latitude.toFixed(5)},{" "}
                      {incident.longitude.toFixed(5)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {incident.notes ? (
                <div className="mt-2">
                  <p className="text-muted text-xs">Courier notes</p>
                  <p className="text-sm">{incident.notes}</p>
                  {incident.notes
                    .match(/media:[a-f0-9]{24}/g)
                    ?.map((reference) => (
                      <MediaPreview
                        key={reference}
                        reference={reference}
                        accessToken={requireAdminToken()}
                      />
                    ))}
                </div>
              ) : null}
            </Card.Content>
          </Card>

          <Card className="p-4">
            <Card.Content className="flex flex-col gap-2 p-0">
              <Typography type="h3" className="font-medium">
                Workflow
              </Typography>
              {workflow.currentStep ? (
                <p className="text-sm">
                  Current step: <strong>{workflow.currentStep}</strong>
                </p>
              ) : null}
              {workflow.waitUntil ? (
                <p className="text-sm text-amber-600">
                  Wait until {new Date(workflow.waitUntil).toLocaleString()}
                </p>
              ) : null}
              {workflow.debtCents != null ? (
                <p className="text-sm">
                  Recorded debt: €{(workflow.debtCents / 100).toFixed(2)}
                </p>
              ) : null}
              {workflow.steps?.length ? (
                <ol className="mt-1 list-decimal pl-5 text-sm">
                  {workflow.steps.map((step) => (
                    <li
                      key={step}
                      className={
                        step === workflow.currentStep
                          ? "font-medium"
                          : "text-muted"
                      }
                    >
                      {step.replace(/_/g, " ")}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted text-sm">
                  No workflow steps recorded.
                </p>
              )}
            </Card.Content>
          </Card>

          {incident.resolveNotes || incident.resolvedAt ? (
            <Card className="p-4">
              <Card.Content className="flex flex-col gap-2 p-0">
                <Typography type="h3" className="font-medium">
                  Resolution
                </Typography>
                {incident.resolvedAt ? (
                  <p className="text-sm">
                    {incident.status} at{" "}
                    {new Date(incident.resolvedAt).toLocaleString()}
                  </p>
                ) : null}
                {incident.resolveNotes ? (
                  <p className="text-sm">{incident.resolveNotes}</p>
                ) : null}
                {incident.replacementCourierId ? (
                  <p className="text-muted text-xs">
                    Replacement courier: {incident.replacementCourierId}
                  </p>
                ) : null}
              </Card.Content>
            </Card>
          ) : null}

          {!isClosed ? (
            <Card className="p-4">
              <FormScope>
                <Card.Content className="flex flex-col gap-3 p-0">
                  <Typography type="h3" className="font-medium">
                    Resolve
                  </Typography>
                  <TextArea
                    label={<>Ops notes</>}
                    wrapperClassName="flex flex-col gap-1 text-sm"
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    rows={3}
                    className="border-border bg-background rounded-md border px-3 py-2"
                    placeholder="Customer contacted, courier reassigned…"
                  />
                  <Input
                    entity="courier"
                    label={<>Replacement courier (optional)</>}
                    wrapperClassName="flex flex-col gap-1 text-sm"
                    value={replacementCourierId}
                    onChange={(e) => setReplacementCourierId(e.target.value)}
                    className="border-border bg-background rounded-md border px-3 py-2 font-mono text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <FormAction
                      variant="primary"
                      size="sm"
                      isDisabled={busy}
                      onPress={() => resolve("resolved")}
                    >
                      Mark resolved
                    </FormAction>
                    <FormAction
                      variant="secondary"
                      size="sm"
                      isDisabled={busy}
                      onPress={() => resolve("cancelled")}
                    >
                      Cancel incident
                    </FormAction>
                  </div>
                </Card.Content>
              </FormScope>
            </Card>
          ) : null}

          <Button variant="secondary" size="sm" onPress={load}>
            Refresh
          </Button>
        </div>
      }
    </FormScope>
  );
}
