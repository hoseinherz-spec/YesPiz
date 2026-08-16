'use client';

import {
  ApiError,
  catalogClient,
  qualityClient,
  type PublishedMenuItem,
  type ProviderQualityView,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { requireAdminToken } from '@/lib/auth';
import { entityId } from '@/lib/ids';
import { useLoadOnMount } from '@/lib/load-on-mount';

const INCIDENT_KINDS = [
  { kind: 'complaint' as const, label: 'Record complaint' },
  { kind: 'delay' as const, label: 'Record delay' },
  { kind: 'error' as const, label: 'Record error' },
];

export default function QualityDetailPage() {
  const params = useParams<{ id: string }>();
  const providerId = params.id;

  const [quality, setQuality] = useState<ProviderQualityView | null>(null);
  const [menuVersion, setMenuVersion] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<PublishedMenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [unsuspendReason, setUnsuspendReason] = useState('');
  const [testForm, setTestForm] = useState({
    customerId: '',
    addressId: '',
    menuItemId: '',
    quantity: '1',
    notes: 'admin demo test order',
  });
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const [q, menu] = await Promise.all([
        qualityClient.getProvider(providerId, { accessToken: token }),
        catalogClient.getPublishedMenu(),
      ]);
      setQuality(q);
      setMenuVersion(menu.version?.version ?? null);
      const items = menu.items ?? [];
      setMenuItems(items);
      if (items.length) {
        setTestForm((f) =>
          f.menuItemId ? f : { ...f, menuItemId: entityId(items[0]) },
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load provider');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useLoadOnMount(() => {
    void load();
  });

  async function recordIncident(kind: 'complaint' | 'delay' | 'error') {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = requireAdminToken();
      const updated = await qualityClient.recordIncident(
        providerId,
        { kind },
        { accessToken: token },
      );
      setQuality(updated);
      setMessage(`Recorded ${kind}. Score is now ${updated.qualityScore}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record incident');
    } finally {
      setBusy(false);
    }
  }

  async function unsuspend() {
    if (!unsuspendReason.trim()) {
      setError('Unsuspend requires a reason.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = requireAdminToken();
      const updated = await qualityClient.unsuspend(
        providerId,
        { reason: unsuspendReason.trim() },
        { accessToken: token },
      );
      setQuality(updated);
      setUnsuspendReason('');
      setMessage('Provider unsuspended.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unsuspend failed');
    } finally {
      setBusy(false);
    }
  }

  async function createTestOrder() {
    if (!menuVersion) {
      setError('No published menu version.');
      return;
    }
    if (!testForm.customerId.trim() || !testForm.addressId.trim()) {
      setError('Customer ID and address ID are required for test orders.');
      return;
    }
    if (!testForm.menuItemId) {
      setError('Select a menu item.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    setTestResult(null);
    try {
      const token = requireAdminToken();
      const order = await qualityClient.createTestOrder(
        {
          providerId,
          customerId: testForm.customerId.trim(),
          addressId: testForm.addressId.trim(),
          menuVersion,
          lines: [
            {
              menuItemId: testForm.menuItemId,
              quantity: Math.max(1, Number(testForm.quantity) || 1),
            },
          ],
          notes: testForm.notes.trim() || undefined,
        },
        { accessToken: token },
      );
      const orderId = entityId(order as { id?: string; _id?: unknown });
      setTestResult(orderId);
      setMessage(`Test order created (${orderId}).`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Test order failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-muted text-sm">Loading…</p>;
  }

  if (!quality) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-500">{error ?? 'Provider not found'}</p>
        <Link href="/quality" className="text-sm underline">
          Back to quality list
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/quality" className="text-muted text-sm hover:underline">
          ← Quality list
        </Link>
        <Typography type="h1" className="mt-2 text-2xl font-semibold">
          Provider quality
        </Typography>
        <p className="text-muted text-sm">ID {providerId}</p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {message ? <p className="text-sm text-green-600">{message}</p> : null}

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-2 p-0">
          <Typography type="h3" className="font-medium">
            Score & evidence
          </Typography>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Quality score</dt>
              <dd className="font-medium">{quality.qualityScore}/100</dd>
            </div>
            <div>
              <dt className="text-muted">Public rating</dt>
              <dd className="font-medium">{quality.rating}</dd>
            </div>
            <div>
              <dt className="text-muted">Complaints</dt>
              <dd className="font-medium">{quality.complaintCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Delays</dt>
              <dd className="font-medium">{quality.delayCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Errors</dt>
              <dd className="font-medium">{quality.errorCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Accepting orders</dt>
              <dd className="font-medium">
                {quality.acceptingOrders ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
          {quality.autoSuspended ? (
            <div className="mt-2 rounded-md bg-red-500/10 p-3 text-sm">
              <p className="font-medium text-red-700">Auto-suspended</p>
              {quality.suspendedAt ? (
                <p className="text-muted text-xs">
                  Since {new Date(quality.suspendedAt).toLocaleString()}
                </p>
              ) : null}
              {quality.suspendReason ? (
                <p className="mt-1">{quality.suspendReason}</p>
              ) : null}
            </div>
          ) : null}
        </Card.Content>
      </Card>

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3 p-0">
          <Typography type="h3" className="font-medium">
            Record penalty
          </Typography>
          <p className="text-muted text-sm">
            Applies a quality incident and may auto-suspend at threshold.
          </p>
          <div className="flex flex-wrap gap-2">
            {INCIDENT_KINDS.map(({ kind, label }) => (
              <Button
                key={kind}
                size="sm"
                variant="secondary"
                isDisabled={busy}
                onPress={() => recordIncident(kind)}
              >
                {label}
              </Button>
            ))}
          </div>
        </Card.Content>
      </Card>

      {quality.autoSuspended ? (
        <Card className="p-4">
          <Card.Content className="flex flex-col gap-3 p-0">
            <Typography type="h3" className="font-medium">
              Unsuspend
            </Typography>
            <label className="flex flex-col gap-1 text-sm">
              Reason (required)
              <textarea
                value={unsuspendReason}
                onChange={(e) => setUnsuspendReason(e.target.value)}
                rows={3}
                className="border-border bg-background rounded-md border px-3 py-2"
                placeholder="Ops review complete — kitchen checklist retrained"
              />
            </label>
            <Button
              variant="primary"
              size="sm"
              isDisabled={busy || !unsuspendReason.trim()}
              onPress={unsuspend}
            >
              Unsuspend provider
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3 p-0">
          <Typography type="h3" className="font-medium">
            Test order
          </Typography>
          <p className="text-muted text-sm">
            Skips payment and assigns directly to this kitchen. Use demo customer
            and address IDs from the seed output (see docs/DEMO.md).
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Customer ID
              <input
                value={testForm.customerId}
                onChange={(e) =>
                  setTestForm((f) => ({ ...f, customerId: e.target.value }))
                }
                className="border-border bg-background rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Address ID
              <input
                value={testForm.addressId}
                onChange={(e) =>
                  setTestForm((f) => ({ ...f, addressId: e.target.value }))
                }
                className="border-border bg-background rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Menu item
              <select
                value={testForm.menuItemId}
                onChange={(e) =>
                  setTestForm((f) => ({ ...f, menuItemId: e.target.value }))
                }
                className="border-border bg-background rounded-md border px-3 py-2"
              >
                {menuItems.map((item) => (
                  <option key={entityId(item)} value={entityId(item)}>
                    {item.name} (€{(item.priceCents / 100).toFixed(2)})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Quantity
              <input
                type="number"
                min={1}
                value={testForm.quantity}
                onChange={(e) =>
                  setTestForm((f) => ({ ...f, quantity: e.target.value }))
                }
                className="border-border bg-background rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Menu version
              <input
                readOnly
                value={menuVersion ?? '—'}
                className="border-border bg-muted/30 rounded-md border px-3 py-2"
              />
            </label>
          </div>
          <Button
            variant="primary"
            size="sm"
            isDisabled={busy}
            onPress={createTestOrder}
          >
            Create test order
          </Button>
          {testResult ? (
            <p className="text-muted text-xs">Order ID: {testResult}</p>
          ) : null}
        </Card.Content>
      </Card>

      <Button variant="secondary" size="sm" onPress={load}>
        Refresh
      </Button>
    </div>
  );
}
