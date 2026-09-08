'use client';

import {
  ApiError,
  providersClient,
  qualityClient,
  type Provider,
  type ProviderQualityView,
} from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { requireAdminToken } from '@/lib/auth';
import { entityId } from '@/lib/ids';
import { useLoadOnMount } from '@/lib/load-on-mount';

type ProviderRow = Provider & { quality: ProviderQualityView };

export default function QualityListPage() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const providers = await providersClient.list({ accessToken: token });
      const withQuality = await Promise.all(
        providers.map(async (provider) => {
          const id = entityId(provider);
          const quality = await qualityClient.getProvider(id, {
            accessToken: token,
          });
          return { ...provider, quality };
        }),
      );
      withQuality.sort(
        (a, b) => a.quality.qualityScore - b.quality.qualityScore,
      );
      setRows(withQuality);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load quality');
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography type="h1" className="text-2xl font-semibold">
            Quality OS
          </Typography>
          <p className="text-muted text-sm">
            Provider scores, suspension state, and evidence counts
          </p>
        </div>
        <Button variant="secondary" size="sm" onPress={load}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-muted text-sm">Loading…</p> : null}

      {!loading && !rows.length ? (
        <Card className="p-4">
          <Card.Content className="p-0">
            <p className="text-sm">No providers found.</p>
          </Card.Content>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const id = entityId(row);
          const q = row.quality;
          return (
            <Card key={id} className="p-4">
              <Card.Content className="flex flex-col gap-2 p-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Typography type="h3" className="font-medium">
                      {row.name}
                      {q.autoSuspended ? (
                        <span className="ml-2 rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-danger">
                          Suspended
                        </span>
                      ) : null}
                    </Typography>
                    <p className="text-muted text-sm">{row.address}</p>
                    <p className="text-muted text-xs">
                      Score {q.qualityScore}/100 · complaints {q.complaintCount}{' '}
                      · delays {q.delayCount} · errors {q.errorCount}
                    </p>
                    {q.suspendReason ? (
                      <p className="text-xs text-danger">{q.suspendReason}</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/quality/${id}`}
                    className="border-border rounded-md border px-3 py-2 text-sm font-medium hover:opacity-80"
                  >
                    View detail
                  </Link>
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
