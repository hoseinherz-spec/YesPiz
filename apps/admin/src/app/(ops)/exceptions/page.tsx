'use client';

import {
  ApiError,
  ordersClient,
  type AdminResolveStatus,
  type Order,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import { useCallback, useState } from 'react';
import { requireAdminToken } from '@/lib/auth';
import { entityId, formatCents } from '@/lib/ids';
import { useLoadOnMount } from '@/lib/load-on-mount';

const RESOLVE_ACTIONS: Array<{
  status: AdminResolveStatus;
  label: string;
  variant: 'primary' | 'secondary';
}> = [
  { status: 'ADMIN_REVIEW', label: 'Escalate to review', variant: 'secondary' },
  { status: 'PREPARING', label: 'Return to kitchen', variant: 'primary' },
  { status: 'CANCELLED', label: 'Cancel order', variant: 'secondary' },
];

export default function ExceptionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const list = await ordersClient.listAdminReview({ accessToken: token });
      setOrders(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  async function resolve(orderId: string, status: AdminResolveStatus) {
    setBusyId(orderId);
    setError(null);
    try {
      const token = requireAdminToken();
      await ordersClient.resolveAdminReview(
        orderId,
        { status },
        { accessToken: token },
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Resolve failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography type="h1" className="text-2xl font-semibold">
            Exceptions
          </Typography>
          <p className="text-muted text-sm">
            Orders in EXCEPTION_REPORTED or ADMIN_REVIEW
          </p>
        </div>
        <Button variant="secondary" size="sm" onPress={load}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-muted text-sm">Loading…</p> : null}

      {!loading && !orders.length ? (
        <Card className="p-4">
          <Card.Content className="p-0">
            <p className="text-sm">No exception orders right now.</p>
          </Card.Content>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {orders.map((order) => {
          const id = entityId(order);
          return (
            <Card key={id} className="p-4">
              <Card.Content className="flex flex-col gap-2 p-0">
                <div className="flex flex-wrap justify-between gap-2">
                  <Typography type="h3" className="font-medium">
                    {order.status}
                  </Typography>
                  <span className="text-sm">{formatCents(order.totalCents)}</span>
                </div>
                <p className="text-muted text-xs">Order {id}</p>
                <ul className="mt-1 text-sm">
                  {(order.lines ?? []).map((line, idx) => (
                    <li key={`${id}-${idx}`}>
                      {line.quantity}× {line.name}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  {RESOLVE_ACTIONS.filter((a) => a.status !== order.status).map(
                    (action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.variant}
                        isDisabled={busyId === id}
                        onPress={() => resolve(id, action.status)}
                      >
                        {action.label}
                      </Button>
                    ),
                  )}
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
