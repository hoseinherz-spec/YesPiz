'use client';

import {
  ApiError,
  batchesClient,
  providersClient,
  type Batch,
  type SuggestBatchResponse,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import { useCallback, useState } from 'react';
import { requireProviderToken } from '@/lib/auth';
import { entityId } from '@/lib/ids';
import { useLoadOnMount } from '@/lib/load-on-mount';

export default function BatchesPage() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestBatchResponse | null>(
    null,
  );
  const [batches, setBatches] = useState<Batch[]>([]);
  const [keepByBatch, setKeepByBatch] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const [profile, list] = await Promise.all([
        providersClient.getMeProfile({ accessToken: token }),
        batchesClient.listForProvider({ accessToken: token }),
      ]);
      setProviderId(entityId(profile));
      setBatches(list);
      const nextKeep: Record<string, string[]> = {};
      for (const batch of list) {
        const id = entityId(batch);
        nextKeep[id] = (batch.orderIds ?? []).map((oid) => String(oid));
      }
      setKeepByBatch(nextKeep);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load batches');
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  async function suggest() {
    if (!providerId) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const res = await batchesClient.suggest(
        { providerId },
        { accessToken: token },
      );
      setSuggestion(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suggest failed');
    } finally {
      setBusy(false);
    }
  }

  async function createFromSuggestion() {
    if (!providerId || !suggestion?.suggestedOrderIds.length) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      await batchesClient.create(
        {
          providerId,
          orderIds: suggestion.suggestedOrderIds,
        },
        { accessToken: token },
      );
      setSuggestion(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function reduceBatch(batchId: string) {
    const keepOrderIds = keepByBatch[batchId] ?? [];
    if (!keepOrderIds.length) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      await batchesClient.reduce(
        batchId,
        { keepOrderIds },
        { accessToken: token },
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reduce failed');
    } finally {
      setBusy(false);
    }
  }

  function toggleKeep(batchId: string, orderId: string) {
    setKeepByBatch((prev) => {
      const current = prev[batchId] ?? [];
      const next = current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId];
      return { ...prev, [batchId]: next };
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <Typography type="h1" className="text-2xl font-semibold">
          Batches
        </Typography>
        <p className="text-muted text-sm">Suggest, create, and reduce batches</p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3 p-0">
          <Typography type="h3" className="font-medium">
            Suggest batch
          </Typography>
          <p className="text-muted text-sm">
            Pulls ready-for-pickup orders up to max batch size.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" isDisabled={busy || !providerId} onPress={suggest}>
              Suggest
            </Button>
            <Button
              variant="primary"
              isDisabled={
                busy || !suggestion?.suggestedOrderIds.length
              }
              onPress={createFromSuggestion}
            >
              Create from suggestion
            </Button>
          </div>
          {suggestion ? (
            <div className="text-sm">
              <p>
                Suggested {suggestion.suggestedOrderIds.length} / max{' '}
                {suggestion.maxBatchSize}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {suggestion.suggestedOrderIds.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card.Content>
      </Card>

      <div className="flex flex-col gap-3">
        {batches.map((batch) => {
          const id = entityId(batch);
          const orderIds = (batch.orderIds ?? []).map((oid) => String(oid));
          return (
            <Card key={id} className="p-4">
              <Card.Content className="flex flex-col gap-2 p-0">
                <div className="flex flex-wrap justify-between gap-2">
                  <Typography type="h3" className="font-medium">
                    {batch.status}
                  </Typography>
                  <span className="text-muted text-xs">
                    weight {batch.totalPrepWeight}
                  </span>
                </div>
                <p className="text-muted text-xs">Batch {id}</p>
                <ul className="space-y-1 text-sm">
                  {orderIds.map((orderId) => (
                    <li key={orderId}>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(keepByBatch[id] ?? []).includes(orderId)}
                          onChange={() => toggleKeep(id, orderId)}
                        />
                        {orderId}
                      </label>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={busy || batch.status !== 'open'}
                  onPress={() => reduceBatch(id)}
                >
                  Reduce to checked
                </Button>
              </Card.Content>
            </Card>
          );
        })}
        {!batches.length ? (
          <p className="text-muted text-sm">No batches yet</p>
        ) : null}
      </div>
    </div>
  );
}
