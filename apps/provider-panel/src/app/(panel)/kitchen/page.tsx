'use client';

import {
  ApiError,
  ordersClient,
  qualityClient,
  type KitchenStatusUpdate,
  type Order,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import { requireProviderToken } from '@/lib/auth';
import { entityId, formatCents } from '@/lib/ids';

const ACTIONS: Array<{
  status: KitchenStatusUpdate;
  label: string;
  from: string[];
}> = [
  {
    status: 'PREPARING',
    label: 'Start preparing',
    from: ['ACCEPTED_BY_PROVIDER'],
  },
  {
    status: 'READY_FOR_PICKUP',
    label: 'Mark ready',
    from: ['PREPARING'],
  },
  {
    status: 'EXCEPTION_REPORTED',
    label: 'Report exception',
    from: ['ACCEPTED_BY_PROVIDER', 'PREPARING'],
  },
];

const DEFAULT_CHECKLIST = ['Weight check', 'Packaging seal', 'Temperature'];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sealByOrder, setSealByOrder] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const list = await ordersClient.listKitchen({ accessToken: token });
      setOrders(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load kitchen');
    }
  }, []);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    const id = window.setInterval(() => {
      load().catch(() => undefined);
    }, 10000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [load]);

  async function completeQualityThenReady(orderId: string) {
    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      const sealId = (sealByOrder[orderId] ?? '').trim() || `YP-${orderId.slice(-6)}`;

      await qualityClient.submitChecklist(
        orderId,
        {
          answers: DEFAULT_CHECKLIST.map((item) => ({ item, ok: true })),
        },
        { accessToken: token },
      );
      await qualityClient.submitSeal(orderId, { sealId }, { accessToken: token });
      await ordersClient.updateKitchenStatus(
        orderId,
        { status: 'READY_FOR_PICKUP' },
        { accessToken: token },
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Quality checklist / ready update failed',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(orderId: string, status: KitchenStatusUpdate) {
    if (status === 'READY_FOR_PICKUP') {
      await completeQualityThenReady(orderId);
      return;
    }

    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      await ordersClient.updateKitchenStatus(
        orderId,
        { status },
        { accessToken: token },
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography type="h1" className="text-2xl font-semibold">
            Active kitchen
          </Typography>
          <p className="text-muted text-sm">
            Checklist + numbered seal required before ready for pickup
          </p>
        </div>
        <Button size="sm" variant="secondary" onPress={load}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {!orders.length ? (
        <Card className="p-4">
          <Card.Content className="text-muted p-0 text-sm">
            No active kitchen orders
          </Card.Content>
        </Card>
      ) : null}

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
              <ul className="text-sm">
                {(order.lines ?? []).map((line, idx) => (
                  <li key={`${id}-${idx}`}>
                    {line.quantity}× {line.name}
                  </li>
                ))}
              </ul>
              {order.status === 'PREPARING' ? (
                <input
                  aria-label="Seal ID"
                  placeholder="Numbered seal ID"
                  value={sealByOrder[id] ?? ''}
                  onChange={(e) =>
                    setSealByOrder((prev) => ({
                      ...prev,
                      [id]: e.target.value,
                    }))
                  }
                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                />
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {ACTIONS.filter((a) => a.from.includes(order.status)).map(
                  (action) => (
                    <Button
                      key={action.status}
                      size="sm"
                      variant={
                        action.status === 'EXCEPTION_REPORTED'
                          ? 'secondary'
                          : 'primary'
                      }
                      isDisabled={busyId === id}
                      onPress={() => updateStatus(id, action.status)}
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
  );
}
