"use client";
import { AdminTable, DataList } from "@/components/AdminTable";
import { Select } from "@/components/AdminForms";

import {
  ApiError,
  ordersClient,
  type AtRiskDashboardResponse,
  type LiveOperationsView,
} from "@repo/api";
import { OperationsMap } from "@repo/api/components/operations-map";
import Link from "next/link";
import { Button, Card, Typography } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
import { formatCents } from "@/lib/ids";
import { useLoadOnMount } from "@/lib/load-on-mount";

export default function LiveOpsPage() {
  const [live, setLive] = useState<LiveOperationsView | null>(null);
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState<AtRiskDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshing = useRef(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const load = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const [dashboard, operations] = await Promise.all([
        ordersClient.listAtRisk({ accessToken: token }),
        ordersClient.liveOperations({ accessToken: token }),
      ]);
      setLive(operations);
      setData(dashboard);
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load live ops",
      );
    } finally {
      setLoading(false);
      refreshing.current = false;
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);

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
            {updatedAt ? ` · Updated ${updatedAt}` : ""}
          </p>
        </div>
        <Button variant="secondary" size="sm" onPress={load}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-muted text-sm">Loading…</p> : null}

      {live && (
        <section className="grid gap-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <strong>{live.orders.length} active orders</strong>
            <span>{live.couriers.length} on-duty couriers</span>
            <span>
              {live.last24Hours.reduce((n, s) => n + s.count, 0)} orders / 24h
            </span>
            <span>
              {formatCents(
                live.last24Hours.reduce((n, s) => n + s.revenueCents, 0),
              )}{" "}
              captured / 24h
            </span>
          </div>
          <OperationsMap
            points={[
              ...live.orders.flatMap((o) =>
                o.destination
                  ? [
                      {
                        id: o.orderId,
                        ...o.destination,
                        label: `Order ${o.orderId.slice(-6)} · ${o.status}`,
                        kind: "order" as const,
                      },
                    ]
                  : [],
              ),
              ...live.couriers.flatMap((c) =>
                c.location
                  ? [
                      {
                        id: `courier:${c.courierId}`,
                        ...c.location,
                        label: `Courier ${c.courierId.slice(-6)} · ${c.orderCount} orders`,
                        kind: "courier" as const,
                      },
                    ]
                  : [],
              ),
            ]}
          />
          <div className="text-sm">
            <Select
              label={<>Order status </>}
              className="ml-3 rounded-lg border p-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              {[...new Set(live.orders.map((o) => o.status))].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </div>
          {live.truncated && (
            <p role="status">Showing the oldest 500 active orders.</p>
          )}
          <div className="max-h-80 overflow-auto">
            <AdminTable
              aria-label="Live orders"
              className="w-full text-left text-sm"
            >
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {live.orders
                  .filter((o) => filter === "all" || o.status === filter)
                  .map((o) => (
                    <tr key={o.orderId} className="border-b">
                      <td className="py-3">{o.orderId.slice(-8)}</td>
                      <td>{o.status}</td>
                      <td>{formatCents(o.totalCents)}</td>
                      <td>
                        <Link
                          className="underline"
                          href={`/order-tools/?orderId=${o.orderId}`}
                        >
                          Review order
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </AdminTable>
          </div>
          <p className="text-xs text-muted">
            {live.couriers.filter((c) => !c.location).length} couriers have no
            fresh GPS fix.
          </p>
        </section>
      )}

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
              <p className="text-xl font-semibold">
                {summary.openIncidentCount}
              </p>
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
          <DataList
            data={data.exceptionOrders}
            label="exception orders"
            renderItem={(row) => (
              <Card key={row.orderId} className="p-3">
                <Card.Content className="flex flex-wrap justify-between gap-2 p-0 text-sm">
                  <span>
                    {row.orderId} · {row.status}
                  </span>
                  <span>{formatCents(row.totalCents)}</span>
                </Card.Content>
              </Card>
            )}
          />
        </section>
      ) : null}

      {data?.openIncidents.length ? (
        <section className="flex flex-col gap-2">
          <Typography type="h2" className="text-lg font-medium">
            Open incidents
          </Typography>
          <DataList
            data={data.openIncidents}
            label="open incidents"
            renderItem={(row) => (
              <Card key={row.incidentId} className="p-3">
                <Card.Content className="flex flex-wrap justify-between gap-2 p-0 text-sm">
                  <span>
                    {row.kind} · order {row.orderId}
                    {row.sos ? " · SOS" : ""}
                  </span>
                  <span>{row.status}</span>
                </Card.Content>
              </Card>
            )}
          />
        </section>
      ) : null}

      {data?.delayedOrders.length ? (
        <section className="flex flex-col gap-2">
          <Typography type="h2" className="text-lg font-medium">
            Delayed ETA
          </Typography>
          <DataList
            data={data.delayedOrders}
            label="delayed orders"
            renderItem={(row) => (
              <Card key={row.orderId} className="p-3">
                <Card.Content className="flex flex-wrap justify-between gap-2 p-0 text-sm">
                  <span>
                    {row.orderId} · {row.status}
                  </span>
                  <span>{formatCents(row.totalCents)}</span>
                </Card.Content>
              </Card>
            )}
          />
        </section>
      ) : null}

      {!loading &&
      data &&
      !summary?.exceptionCount &&
      !summary?.openIncidentCount &&
      !summary?.delayedCount ? (
        <Card className="p-4">
          <Card.Content className="p-0">
            <p className="text-sm">No at-risk orders right now.</p>
          </Card.Content>
        </Card>
      ) : null}
    </div>
  );
}
