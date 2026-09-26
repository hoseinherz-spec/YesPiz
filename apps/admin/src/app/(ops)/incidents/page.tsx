"use client";
import { DataList } from "@/components/AdminTable";
import { FormScope, Input } from "@/components/AdminForms";

import {
  ApiError,
  incidentsClient,
  type Incident,
  type IncidentKind,
} from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
import { entityId } from "@/lib/ids";
import { useLoadOnMount } from "@/lib/load-on-mount";

function kindLabel(kind: IncidentKind): string {
  return kind.replace(/_/g, " ");
}

function ageMinutes(now: number, createdAt?: string): number | null {
  if (!createdAt) return null;
  return Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 60_000),
  );
}

function isCritical(kind: IncidentKind): boolean {
  return kind === "sos" || kind === "crash";
}

export default function IncidentsPage() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [query, setQuery] = useState("");
  const [onlyActionable, setOnlyActionable] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const fetching = useRef(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (quiet = false) => {
    if (fetching.current) return;
    fetching.current = true;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const list = await incidentsClient.listOpen({ accessToken: token });
      setIncidents(list);
      setUpdatedAt(Date.now());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load incidents",
      );
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 15_000);
    return () => clearInterval(timer);
  }, [load]);

  function isWaiting(incident: Incident) {
    const until = incident.workflow?.waitUntil;
    return (
      !isCritical(incident.kind) &&
      typeof until === "string" &&
      new Date(until).getTime() > now
    );
  }
  const visible = incidents
    .filter((incident) => {
      const matches = [
        incident.orderId,
        incident.courierId,
        incident.kind.replaceAll("_", " "),
        incident.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matches && (!onlyActionable || !isWaiting(incident));
    })
    .sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime(),
    );
  const critical = visible.filter((i) => isCritical(i.kind));
  const routine = visible.filter((i) => !isCritical(i.kind));

  function renderCard(incident: Incident) {
    const id = entityId(incident);
    const age = ageMinutes(now, incident.createdAt);
    const workflow = (incident.workflow ?? {}) as {
      currentStep?: string;
      waitUntil?: string;
    };
    const waitUntil = workflow.waitUntil ? new Date(workflow.waitUntil) : null;
    const waiting = waitUntil && waitUntil.getTime() > now;

    return (
      <Card key={id} className="p-4">
        <Card.Content className="flex flex-col gap-2 p-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Typography type="h3" className="font-medium capitalize">
                {kindLabel(incident.kind)}
                {isCritical(incident.kind) ? (
                  <span className="ml-2 rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-danger">
                    Critical
                  </span>
                ) : null}
              </Typography>
              <p className="text-muted text-sm">
                {incident.status}
                {age != null ? ` · ${age}m open` : ""}
              </p>
              <p className="text-muted text-xs">
                Order {incident.orderId} · Courier {incident.courierId}
              </p>
              {workflow.currentStep ? (
                <p className="text-xs">Step: {workflow.currentStep}</p>
              ) : null}
              {waiting ? (
                <p className="text-xs text-amber-600">
                  Wait until {waitUntil!.toLocaleTimeString()}
                </p>
              ) : null}
              {waitUntil && !waiting ? (
                <p className="text-sm font-semibold text-danger">
                  Wait finished — follow up now
                </p>
              ) : null}
              {incident.notes ? (
                <p className="mt-1 text-sm">{incident.notes}</p>
              ) : null}
            </div>
            <Link
              href={`/incidents/${id}`}
              className="border-border rounded-md border px-3 py-2 text-sm font-medium hover:opacity-80"
            >
              Open
            </Link>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Typography type="h1" className="text-2xl font-semibold">
                Incident command
              </Typography>
              <p className="text-muted text-sm">
                Open courier incidents ({incidents.length})
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void load()}
              isDisabled={loading}
            >
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              label={<>Search incidents</>}
              wrapperClassName="flex flex-1 flex-col gap-1 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order, courier, incident type or notes"
              className="rounded-md border border-border bg-background px-3 py-2"
            />
            <Input
              label={<>Ready for action</>}
              wrapperClassName="flex items-center gap-2 text-sm"
              type="checkbox"
              checked={onlyActionable}
              onChange={(event) => setOnlyActionable(event.target.checked)}
            />
          </div>
          <p className="text-sm text-muted" role="status">
            {updatedAt
              ? `Updated ${new Date(updatedAt).toLocaleTimeString()} · Refreshes every 15 seconds · Oldest first within each priority`
              : "Connecting to operations…"}
          </p>
          {!loading && incidents.length > 0 && !visible.length ? (
            <p>No incidents match these filters.</p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          {loading ? <p className="text-muted text-sm">Loading…</p> : null}

          {!loading && !error && !incidents.length ? (
            <Card className="p-4">
              <Card.Content className="p-0">
                <p className="text-sm">No open incidents.</p>
              </Card.Content>
            </Card>
          ) : null}

          {critical.length ? (
            <section className="flex flex-col gap-3">
              <Typography type="h3" className="font-medium text-danger">
                Critical ({critical.length})
              </Typography>
              <DataList
                data={critical}
                label="critical incidents"
                renderItem={renderCard}
              />
            </section>
          ) : null}

          {routine.length ? (
            <section className="flex flex-col gap-3">
              <Typography type="h3" className="font-medium">
                Queue ({routine.length})
              </Typography>
              <DataList
                data={routine}
                label="incident queue"
                renderItem={renderCard}
              />
            </section>
          ) : null}
        </div>
      }
    </FormScope>
  );
}
