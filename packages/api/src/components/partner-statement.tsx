"use client";
import { Withdrawals } from "./withdrawals";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  financeClient,
  type PartnerStatement as Statement,
} from "../domains/finance";
const subscribe = () => () => {};
const money = (cents: number) =>
  new Intl.NumberFormat("en-AT", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
export function PartnerStatement({
  party,
  accessToken: storedToken,
}: {
  party: "provider" | "courier";
  accessToken: string | null;
}) {
  const accessToken = useSyncExternalStore(
    subscribe,
    () => storedToken,
    () => null,
  );
  const [data, setData] = useState<Statement | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setData(await financeClient.statement(party, { accessToken }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load statement.");
    }
  }, [accessToken, party]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">
          {party === "courier" ? "Your earnings" : "Your settlements"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Approved order amounts and recorded payments. Contact operations about
          missing or disputed entries.
        </p>
      </header>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void load()}
        className="rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground"
      >
        Refresh statement
      </button>
      {!accessToken && <p>Sign in to see your statement.</p>}
      {accessToken && !data && !error && (
        <p role="status" className="text-muted">
          Loading your statement…
        </p>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-card p-6">
              <p className="text-sm text-muted">Pending</p>
              <p className="mt-3 text-2xl font-semibold tabular-nums">
                {money(data.pendingCents)}
              </p>
            </div>
            <div className="rounded-3xl bg-card p-6">
              <p className="text-sm text-muted">Bank payment recorded</p>
              <p className="mt-3 text-2xl font-semibold tabular-nums">
                {money(data.paidCents)}
              </p>
            </div>
          </div>
          <p className="text-sm">
            Available to request:{" "}
            <strong>{money(data.withdrawableCents ?? 0)}</strong> · Reserved in
            a withdrawal: <strong>{money(data.reservedCents ?? 0)}</strong>
          </p>
          <Withdrawals
            party={party}
            accessToken={accessToken}
            onChanged={load}
          />
          {!data.entries.length && (
            <p className="rounded-3xl border border-border p-6 text-muted">
              No approved entries yet. Completed deliveries are reviewed by
              operations before a settlement appears here.
            </p>
          )}
          {data.entries.map((row) => (
            <article
              key={row.id}
              className="flex flex-wrap justify-between gap-3 rounded-2xl bg-card p-5"
            >
              <div>
                <p className="font-medium">Order #{row.orderId.slice(-6)}</p>
                <p className="mt-2 text-xs text-muted">
                  {row.status === "paid"
                    ? `Paid ${new Date(row.paidAt!).toLocaleDateString()}`
                    : `Due ${new Date(row.dueAt).toLocaleDateString()}`}
                </p>
                {row.paymentReference && (
                  <p className="mt-2 break-all text-xs text-muted">
                    Transfer: {row.paymentReference}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">
                  {money(row.amountCents)}
                </p>
                <p className="mt-2 text-xs">{row.status}</p>
              </div>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
