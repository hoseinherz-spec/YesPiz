'use client';

import {
  ApiError,
  incidentsClient,
  type Incident,
  type IncidentKind,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { requireAdminToken } from '@/lib/auth';
import { entityId } from '@/lib/ids';
import { useLoadOnMount } from '@/lib/load-on-mount';

function kindLabel(kind: IncidentKind): string {
  return kind.replace(/_/g, ' ');
}

function ageMinutes(createdAt?: string): number | null {
  if (!createdAt) return null;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

function isCritical(kind: IncidentKind): boolean {
  return kind === 'sos' || kind === 'crash';
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const list = await incidentsClient.listOpen({ accessToken: token });
      setIncidents(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  const critical = incidents.filter((i) => isCritical(i.kind));
  const routine = incidents.filter((i) => !isCritical(i.kind));

  function renderCard(incident: Incident) {
    const id = entityId(incident);
    const age = ageMinutes(incident.createdAt);
    const workflow = incident.workflow as {
      currentStep?: string;
      waitUntil?: string;
    };
    const waitUntil = workflow.waitUntil
      ? new Date(workflow.waitUntil)
      : null;
    const waiting = waitUntil && waitUntil.getTime() > Date.now();

    return (
      <Card key={id} className="p-4">
        <Card.Content className="flex flex-col gap-2 p-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Typography type="h3" className="font-medium capitalize">
                {kindLabel(incident.kind)}
                {isCritical(incident.kind) ? (
                  <span className="ml-2 rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-600">
                    Critical
                  </span>
                ) : null}
              </Typography>
              <p className="text-muted text-sm">
                {incident.status}
                {age != null ? ` · ${age}m open` : ''}
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
        <Button variant="secondary" size="sm" onPress={load}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {loading ? <p className="text-muted text-sm">Loading…</p> : null}

      {!loading && !incidents.length ? (
        <Card className="p-4">
          <Card.Content className="p-0">
            <p className="text-sm">No open incidents.</p>
          </Card.Content>
        </Card>
      ) : null}

      {critical.length ? (
        <section className="flex flex-col gap-3">
          <Typography type="h3" className="font-medium text-red-600">
            Critical ({critical.length})
          </Typography>
          {critical.map(renderCard)}
        </section>
      ) : null}

      {routine.length ? (
        <section className="flex flex-col gap-3">
          <Typography type="h3" className="font-medium">
            Queue ({routine.length})
          </Typography>
          {routine.map(renderCard)}
        </section>
      ) : null}
    </div>
  );
}
