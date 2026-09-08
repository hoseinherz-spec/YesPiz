'use client';

import { ApiError, ordersClient, type AtRiskDashboardResponse } from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import { useCallback, useState } from 'react';
import { requireAdminToken } from '@/lib/auth';
import { formatCents } from '@/lib/ids';
import { useLoadOnMount } from '@/lib/load-on-mount';

export default function LiveOpsPage() {
  const [data, setData] = useState<AtRiskDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const dashboard = await ordersClient.listAtRisk({ accessToken: token });
      setData(dashboard);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load live ops');
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  const summary = data?.summary;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography type="h1" className="text-2xl font-semibold">
            Live ops
          </Typography>
          <p className="text-muted text-sm">
            At-risk orders: exceptions, open incidents, delayed ETA
          </p>
        </div>
        <Button variant="secondary" size="sm" onPress={load}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-muted text-sm">Loading…</p> : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-3">
            <Card.Content className="p-0">
              <p className="text-muted text-xs">Exceptions</p>
              <p className="text-xl font-semibold">{summary.exceptionCount}</p>
            </Card.Content>
          </Card>
          <Card className="p-3">
            <Card.Content className="p-0">
              <p className="text-muted text-xs">Open incidents</p>
              <p className="text-xl font-semibold">{summary.openIncidentCount}</p>
            </Card.Content>
          </Card>
          <Card className="p-3">
            <Card.Content className="p-0">
              <p className="text-muted text-xs">Delayed ETA</p>
              <p className="text-xl font-semibold">{summary.delayedCount}</p>
            </Card.Content>
          </Card>
          <Card className="p-3">
            <Card.Content className="p-0">
              <p className="text-muted text-xs">SOS</p>
              <p className="text-xl font-semibold">{summary.sosCount}</p>
            </Card.Content>
          </Card>
        </div>
      ) : null}

      {data?.exceptionOrders.length ? (
        <section className="flex flex-col gap-2">
          <Typography type="h2" className="text-lg font-medium">
            Exception orders
          </Typography>
          {data.exceptionOrders.map((row) => (
            <Card key={row.orderId} className="p-3">
              <Card.Content className="flex flex-wrap justify-between gap-2 p-0 text-sm">
                <span>
                  {row.orderId} · {row.status}
                </span>
                <span>{formatCents(row.totalCents)}</span>
              </Card.Content>
            </Card>
          ))}
        </section>
      ) : null}

      {data?.openIncidents.length ? (
        <section className="flex flex-col gap-2">
          <Typography type="h2" className="text-lg font-medium">
            Open incidents
          </Typography>
          {data.openIncidents.map((row) => (
            <Card key={row.incidentId} className="p-3">
              <Card.Content className="flex flex-wrap justify-between gap-2 p-0 text-sm">
                <span>
                  {row.kind} · order {row.orderId}
                  {row.sos ? ' · SOS' : ''}
                </span>
                <span>{row.status}</span>
              </Card.Content>
            </Card>
          ))}
        </section>
      ) : null}

      {data?.delayedOrders.length ? (
        <section className="flex flex-col gap-2">
          <Typography type="h2" className="text-lg font-medium">
            Delayed ETA
          </Typography>
          {data.delayedOrders.map((row) => (
            <Card key={row.orderId} className="p-3">
              <Card.Content className="flex flex-wrap justify-between gap-2 p-0 text-sm">
                <span>
                  {row.orderId} · {row.status}
                </span>
                <span>{formatCents(row.totalCents)}</span>
              </Card.Content>
            </Card>
          ))}
        </section>
      ) : null}

      {!loading && data && !summary?.exceptionCount && !summary?.openIncidentCount && !summary?.delayedCount ? (
        <Card className="p-4">
          <Card.Content className="p-0">
            <p className="text-sm">No at-risk orders right now.</p>
          </Card.Content>
        </Card>
      ) : null}
    </div>
  );
}
