'use client';

import {
  ApiError,
  dispatchClient,
  type ProviderOffer,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import { requireProviderToken } from '@/lib/auth';
import { formatCents } from '@/lib/ids';

export default function OffersPage() {
  const [offers, setOffers] = useState<ProviderOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const list = await dispatchClient.listOffers({ accessToken: token });
      setOffers(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load offers');
    }
  }, []);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    const id = window.setInterval(() => {
      load().catch(() => undefined);
    }, 8000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [load]);

  async function respond(orderId: string, action: 'accept' | 'reject') {
    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      if (action === 'accept') {
        await dispatchClient.accept(orderId, { accessToken: token });
      } else {
        await dispatchClient.reject(orderId, { accessToken: token });
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography type="h1" className="text-2xl font-semibold">
            Offers inbox
          </Typography>
          <p className="text-muted text-sm">Pending dispatch offers</p>
        </div>
        <Button size="sm" variant="secondary" onPress={load}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {!offers.length ? (
        <Card className="p-4">
          <Card.Content className="p-0 text-sm text-muted">
            No pending offers
          </Card.Content>
        </Card>
      ) : null}

      {offers.map((offer) => (
        <Card key={offer.orderId} className="p-4">
          <Card.Content className="flex flex-col gap-2 p-0">
            <div className="flex flex-wrap justify-between gap-2">
              <Typography type="h3" className="font-medium">
                {formatCents(offer.totalCents)}
              </Typography>
              <span className="text-muted text-xs">
                score {offer.score?.toFixed?.(2) ?? offer.score ?? '—'}
              </span>
            </div>
            <p className="text-muted text-xs">Order {offer.orderId}</p>
            <ul className="text-sm">
              {offer.lines.map((line, idx) => (
                <li key={`${offer.orderId}-${idx}`}>
                  {line.quantity}× {line.name}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                isDisabled={busyId === offer.orderId}
                onPress={() => respond(offer.orderId, 'accept')}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={busyId === offer.orderId}
                onPress={() => respond(offer.orderId, 'reject')}
              >
                Reject
              </Button>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
