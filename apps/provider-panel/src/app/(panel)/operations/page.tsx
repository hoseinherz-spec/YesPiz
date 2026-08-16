'use client';

import {
  ApiError,
  catalogClient,
  providersClient,
  type Provider,
  type PublishedMenuItem,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import { useCallback, useState } from 'react';
import { requireProviderToken } from '@/lib/auth';
import { useLoadOnMount } from '@/lib/load-on-mount';

export default function OperationsPage() {
  const [profile, setProfile] = useState<Provider | null>(null);
  const [menuItems, setMenuItems] = useState<PublishedMenuItem[]>([]);
  const [acceptCap, setAcceptCap] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [pauseUntil, setPauseUntil] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const [me, menu] = await Promise.all([
        providersClient.getMeProfile({ accessToken: token }),
        catalogClient.getPublishedMenu(),
      ]);
      setProfile(me);
      setAcceptCap(me.acceptCap != null ? String(me.acceptCap) : '');
      setMenuItems(menu.items ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load operations');
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  async function saveAcceptCap() {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const trimmed = acceptCap.trim();
      const body: { acceptCap?: number } = {};
      if (trimmed !== '') {
        const parsed = Number.parseInt(trimmed, 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
          setError('Accept cap must be a non-negative number');
          return;
        }
        body.acceptCap = parsed;
      }
      const updated = await providersClient.updateMeProfile(body, {
        accessToken: token,
      });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function pauseOrders() {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const updated = await providersClient.pause(
        {
          reason: pauseReason.trim() || undefined,
          until: pauseUntil ? new Date(pauseUntil).toISOString() : undefined,
        },
        { accessToken: token },
      );
      setProfile(updated);
      setPauseReason('');
      setPauseUntil('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Pause failed');
    } finally {
      setBusy(false);
    }
  }

  async function resumeOrders() {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const updated = await providersClient.resume({ accessToken: token });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Resume failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(itemId: string, unavailable: boolean) {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const updated = unavailable
        ? await providersClient.eightySix(
            { menuItemIds: [itemId] },
            { accessToken: token },
          )
        : await providersClient.clearEightySix(
            { menuItemIds: [itemId] },
            { accessToken: token },
          );
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inventory update failed');
    } finally {
      setBusy(false);
    }
  }

  const unavailable = new Set(profile?.unavailableItemIds ?? []);
  const paused = profile?.acceptingOrders === false;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography type="h1" className="text-2xl font-semibold">
            Operations
          </Typography>
          <p className="text-muted text-sm">
            Capacity, pause, and menu availability
          </p>
        </div>
        <Button size="sm" variant="secondary" onPress={load} isDisabled={busy}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {profile ? (
        <Card className="p-4">
          <Card.Content className="flex flex-col gap-3 p-0">
            <Typography type="h3" className="font-medium">
              Live capacity
            </Typography>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted">Open orders</dt>
                <dd className="font-medium">{profile.openOrders}</dd>
              </div>
              <div>
                <dt className="text-muted">Accept cap</dt>
                <dd className="font-medium">
                  {profile.acceptCap ?? 'No limit'}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Accepting orders</dt>
                <dd className="font-medium">
                  {profile.acceptingOrders ? 'Yes' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd className="font-medium">{paused ? 'Paused' : 'Active'}</dd>
              </div>
            </dl>
            {profile.pauseReason ? (
              <p className="text-muted text-sm">Pause reason: {profile.pauseReason}</p>
            ) : null}
            {profile.pausedUntil ? (
              <p className="text-muted text-sm">
                Paused until {new Date(profile.pausedUntil).toLocaleString()}
              </p>
            ) : null}

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Accept cap (blank = no limit)</span>
              <input
                type="number"
                min={0}
                value={acceptCap}
                onChange={(e) => setAcceptCap(e.target.value)}
                className="border-border bg-background max-w-[10rem] rounded-md border px-3 py-2"
              />
            </label>
            <Button size="sm" variant="secondary" isDisabled={busy} onPress={saveAcceptCap}>
              Save accept cap
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3 p-0">
          <Typography type="h3" className="font-medium">
            Pause / resume
          </Typography>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Reason (optional)</span>
            <input
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Equipment issue, rush, etc."
              className="border-border bg-background rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Resume at (optional)</span>
            <input
              type="datetime-local"
              value={pauseUntil}
              onChange={(e) => setPauseUntil(e.target.value)}
              className="border-border bg-background max-w-[16rem] rounded-md border px-3 py-2"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" isDisabled={busy} onPress={pauseOrders}>
              Pause new offers
            </Button>
            <Button size="sm" variant="secondary" isDisabled={busy} onPress={resumeOrders}>
              Resume
            </Button>
          </div>
        </Card.Content>
      </Card>

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3 p-0">
          <Typography type="h3" className="font-medium">
            Item availability (86)
          </Typography>
          <p className="text-muted text-sm">
            Unavailable items cannot be assigned to your kitchen.
          </p>
          {!menuItems.length ? (
            <p className="text-muted text-sm">No published menu items</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {menuItems.map((item) => {
                const out = unavailable.has(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className={out ? 'text-muted line-through' : ''}>
                      {item.name}
                    </span>
                    <Button
                      size="sm"
                      variant={out ? 'primary' : 'secondary'}
                      isDisabled={busy}
                      onPress={() => toggleItem(item.id, !out)}
                    >
                      {out ? 'Restore' : '86 item'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
