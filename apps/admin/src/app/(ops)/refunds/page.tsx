"use client";
import { useCallback, useEffect, useState } from "react";
import { paymentsClient, groupsClient } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
export default function RefundsPage() {
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof paymentsClient.refunds>>
  >([]);
  const [groups, setGroups] = useState<
    Awaited<ReturnType<typeof groupsClient.refundQueue>>
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const options = { accessToken: requireAdminToken() };
    const [refunds, groupRefunds] = await Promise.all([
      paymentsClient.refunds(options),
      groupsClient.refundQueue(options),
    ]);
    setRows(refunds);
    setGroups(groupRefunds);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch(() => setError("Unable to load refunds."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function reconcile(orderId: string) {
    setBusy(true);
    setError("");
    try {
      await paymentsClient.reconcileRefund(orderId, {
        accessToken: requireAdminToken(),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconciliation failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Refunds</h1>
      <p>
        Cancelled card orders are reconciled automatically. Failed or
        action-required refunds need review in Stripe; refreshing does not
        create a second refund.
      </p>
      {error && <p role="alert">{error}</p>}
      {groups.map((group) => (
        <div key={group.token} className="rounded-xl border p-4 space-y-2">
          <strong>Unplaced group: {group.title}</strong>
          <p>{group.refundError || "Refund processing"}</p>
          <button
            className="rounded-lg border px-4 py-2"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await groupsClient.retryRefund(group.token, {
                  accessToken: requireAdminToken(),
                });
                await load();
              } catch {
                setError("Group refund needs review.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Refresh group refund status
          </button>
        </div>
      ))}
      {!rows.length && <p>No refunds recorded.</p>}
      {rows.map((row) => (
        <div className="rounded-xl border p-4 space-y-2" key={row._id}>
          <p className="font-mono">{row.orderId}</p>
          <p>
            €{(row.amountCents / 100).toFixed(2)} · {row.refundStatus}
          </p>
          {row.refundError && <p>{row.refundError}</p>}
          <button
            disabled={busy}
            className="rounded-lg border px-4 py-2"
            onClick={() => void reconcile(row.orderId)}
          >
            Refresh gateway status
          </button>
        </div>
      ))}
    </section>
  );
}
