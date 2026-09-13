"use client";
import { Form, Select, Input } from "@repo/ui/forms";

import { Withdrawals } from "@repo/api/components/withdrawals";
import { financeClient, type FinanceOverview } from "@repo/api";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
const money = (cents: number) =>
  new Intl.NumberFormat("en-AT", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
export default function FinancePage() {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [party, setParty] = useState("provider");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [payId, setPayId] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setData(
        await financeClient.overview({ accessToken: requireAdminToken() }),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load finance.");
    }
  }, []);
  useEffect(() => {
    // Defer initial loading so synchronous auth/storage failures update after the effect.
    void Promise.resolve().then(load);
  }, [load]);
  async function record() {
    setBusy(true);
    setError("");
    try {
      await financeClient.record(
        {
          orderId,
          party,
          amountCents: Math.round(Number(amount) * 100),
          dueAt: new Date(dueAt).toISOString(),
          note,
        },
        { accessToken: requireAdminToken() },
      );
      setNote("");
      setAmount("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record settlement.");
    } finally {
      setBusy(false);
    }
  }
  async function paid() {
    setBusy(true);
    setError("");
    try {
      await financeClient.paid(payId, reference, {
        accessToken: requireAdminToken(),
      });
      setPayId("");
      setReference("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record transfer.");
    } finally {
      setBusy(false);
    }
  }
  const field =
    "mt-2 w-full rounded-xl bg-field-background p-3 text-foreground";
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Partner finance</p>
          <h1 className="mt-2 text-3xl font-semibold">
            Clear amounts. Traceable payments.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Approve the agreed amount for each completed order. Record an
            external transfer only after it has actually been made.
          </p>
        </div>
        <Button variant="secondary" onPress={() => void load()}>
          Refresh
        </Button>
      </header>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Completed orders", String(data.completed.length)],
              [
                "Order value",
                money(data.completed.reduce((s, o) => s + o.totalCents, 0)),
              ],
              [
                "Delivery credits",
                money(
                  data.completed.reduce(
                    (s, o) => s + (o.compensationCents ?? 0),
                    0,
                  ),
                ),
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl bg-card p-6">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums">
                  {value}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Last 30 days · up to 1,000 completed orders
                </p>
              </div>
            ))}
          </div>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              void record();
            }}
            className="rounded-3xl border border-border p-6"
          >
            <h2 className="text-xl font-semibold">
              Approve an order settlement
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Select
                label={<>Completed order</>}
                wrapperClassName="text-sm"
                required
                className={field}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">Choose an order</option>
                {data.completed.map((o) => (
                  <option key={o._id} value={o._id}>
                    #{o._id.slice(-6)} · {money(o.totalCents)}
                  </option>
                ))}
              </Select>
              <Select
                label={<>Partner</>}
                wrapperClassName="text-sm"
                className={field}
                value={party}
                onChange={(e) => setParty(e.target.value)}
              >
                <option value="provider">Assigned kitchen</option>
                <option value="courier">Assigned courier</option>
              </Select>
              <Input
                label={<>Agreed amount (€)</>}
                wrapperClassName="text-sm"
                required
                type="number"
                min="0"
                max="100000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={field}
              />
              <Input
                label={<>Due date</>}
                wrapperClassName="text-sm"
                required
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className={field}
              />
              <Input
                label={<>Internal accounting note</>}
                wrapperClassName="text-sm md:col-span-2"
                required
                minLength={5}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={field}
              />
            </div>
            <Button
              type="submit"
              className="mt-5"
              isDisabled={
                busy ||
                !orderId ||
                !dueAt ||
                amount === "" ||
                note.trim().length < 5
              }
            >
              Approve settlement
            </Button>
          </Form>
          <Withdrawals
            party="admin"
            accessToken={requireAdminToken()}
            onChanged={load}
          />
          {payId && (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                void paid();
              }}
              className="space-y-4 rounded-3xl bg-card p-6"
            >
              <h2 className="font-semibold">
                Record a completed bank transfer
              </h2>
              <p className="text-sm text-muted">
                This records payment; it does not send money.
              </p>
              <Input
                label={<>Bank transfer reference</>}
                wrapperClassName="block text-sm"
                required
                minLength={5}
                maxLength={100}
                className={field}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  isDisabled={busy || reference.trim().length < 5}
                >
                  Confirm recorded payment
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => setPayId("")}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          )}
          <section>
            <h2 className="text-xl font-semibold">Latest settlements</h2>
            <p className="mt-2 text-sm text-muted">
              One approved amount per order and partner. Internal notes are
              visible only here.
            </p>
            <div className="mt-5 space-y-3">
              {!data.entries.length && (
                <p className="text-muted">No approved settlements yet.</p>
              )}
              {data.entries.map((row) => (
                <article
                  key={row._id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card p-5"
                >
                  <div>
                    <p className="font-medium">
                      #{row.orderId.slice(-6)} · {row.party}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {row.payeeId} · Due{" "}
                      {new Date(row.dueAt).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm">{row.note}</p>
                    {row.transferError && (
                      <p className="mt-2 text-sm text-danger">
                        {row.transferError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <strong>{money(row.amountCents)}</strong>
                    {row.status === "paid" ? (
                      <span className="text-sm">
                        Paid · {row.paymentReference}
                      </span>
                    ) : row.autoTransfer ? (
                      <div className="text-sm">
                        <p>
                          {row.status === "transferred"
                            ? "Transferred to Stripe balance"
                            : row.status}
                        </p>
                        {row.paymentReference && <p>{row.paymentReference}</p>}
                        <p>
                          Historical transfer entry. Reconcile the external
                          record manually.
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onPress={() => {
                          setPayId(row._id);
                          setReference("");
                        }}
                      >
                        Record payment
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold">
              Cash collection · last 30 days
            </h2>
            <p className="mt-2 text-sm text-muted">
              Verified collection receipts, not proof of cash remittance.
            </p>
            {data.cash.map((row) => (
              <p key={row._id} className="mt-3 rounded-xl bg-card p-4 text-sm">
                Courier {row._id} · {row.receipts} receipts ·{" "}
                {money(row.collectedCents)} collected
              </p>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
