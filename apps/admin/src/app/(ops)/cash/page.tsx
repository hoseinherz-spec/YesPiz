"use client";
import { AdminTable, DataList } from "@/components/AdminTable";
import { Form, Input } from "@/components/AdminForms";
import { useCallback, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";
type Cash = {
  rows: {
    courierId: string;
    collectedCents: number;
    remittedCents: number;
    outstandingCents: number;
  }[];
  receipts: {
    _id: string;
    courierId: string;
    reference: string;
    amountCents: number;
    createdAt: string;
    voidedAt?: string;
  }[];
};
const money = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(
    value / 100,
  );
function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (typeof value !== "number" && /^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export default function CashPage() {
  const [data, setData] = useState<Cash | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const key = useRef<string | null>(null);
  const load = useCallback(async () => {
    try {
      setData(
        await apiRequest<Cash>(
          "/api/v1/finance/cash",
          withAuth({ accessToken: requireAdminToken(), method: "GET" }),
        ),
      );
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load cash reconciliation.",
      );
    }
  }, []);
  useLoadOnMount(load);
  async function record(form: HTMLFormElement) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const fields = new FormData(form);
      key.current ??= crypto.randomUUID();
      await apiRequest(
        "/api/v1/finance/cash",
        withAuth({
          accessToken: requireAdminToken(),
          method: "POST",
          body: {
            requestId: key.current,
            courierId: fields.get("courier"),
            reference: fields.get("reference"),
            amountCents: Math.round(Number(fields.get("amount")) * 100),
          },
        }),
      );
      key.current = null;
      form.reset();
      await load();
      setNotice("Cash handover recorded. No money was transferred.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record handover.");
    } finally {
      setBusy(false);
    }
  }
  async function voidReceipt(form: HTMLFormElement, id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await apiRequest(
        `/api/v1/finance/cash/${id}/void`,
        withAuth({
          accessToken: requireAdminToken(),
          method: "POST",
          body: { reason: String(new FormData(form).get("reason")) },
        }),
      );
      await load();
      setNotice("Receipt voided. The original entry remains in the history.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to void receipt.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!data) return;
    const rows = [
      ["Courier", "Collected cents", "Remitted cents", "Outstanding cents"],
      ...data.rows.map((r) => [
        r.courierId,
        r.collectedCents,
        r.remittedCents,
        r.outstandingCents,
      ]),
    ];
    const blob = new Blob(
        [rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "yespiz-cash-reconciliation.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Cash reconciliation</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          All-time cash collection proofs compared with recorded handovers.
          Enter a bank or signed handover reference after checking the evidence.
          Recording a receipt does not move money.
        </p>
      </header>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-success">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onPress={() => void load()}>
          Refresh
        </Button>
        <Button variant="secondary" isDisabled={!data} onPress={download}>
          Export CSV
        </Button>
      </div>
      <section className="overflow-x-auto rounded-3xl border border-border bg-card p-5">
        <AdminTable
          aria-label="Cash collections"
          className="w-full min-w-[560px] text-left text-sm"
        >
          <thead>
            <tr>
              <th>Courier</th>
              <th>Collected</th>
              <th>Remitted</th>
              <th>Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((row) => (
              <tr key={row.courierId} className="border-t border-border">
                <td className="py-4">{row.courierId}</td>
                <td>{money(row.collectedCents)}</td>
                <td>{money(row.remittedCents)}</td>
                <td
                  className={
                    row.outstandingCents < 0 ? "text-warning" : "font-semibold"
                  }
                >
                  {money(row.outstandingCents)}
                  {row.outstandingCents < 0 ? " · review difference" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        {data && !data.rows.length && (
          <p className="mt-4 text-sm text-muted">
            No cash collections or handovers yet.
          </p>
        )}
      </section>
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Record verified handover</h2>
        <Form
          className="mt-4 grid gap-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void record(e.currentTarget);
          }}
        >
          <div className="text-sm">
            <Input
              name="courier"
              required
              entity="courier"
              label="Courier"
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-3"
            />
          </div>
          <div className="text-sm">
            <Input
              label={<>Amount (€)</>}
              name="amount"
              type="number"
              min="0.01"
              max="100000"
              step="0.01"
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-3"
            />
          </div>
          <div className="text-sm">
            <Input
              label={<>Evidence reference</>}
              name="reference"
              maxLength={120}
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-3"
            />
          </div>
          <Button type="submit" isDisabled={busy}>
            Record handover
          </Button>
        </Form>
      </section>
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Receipt history</h2>
        <DataList
          data={data?.receipts}
          label="cash"
          renderItem={(receipt) => (
            <article
              key={receipt._id}
              className="mt-4 border-t border-border pt-4"
            >
              <p className="break-words text-sm">
                {money(receipt.amountCents)} · {receipt.reference} ·{" "}
                {new Date(receipt.createdAt).toLocaleString()}
                {receipt.voidedAt ? " · Voided" : ""}
              </p>
              {!receipt.voidedAt && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-muted">
                    Correct this record
                  </summary>
                  <Form
                    className="mt-3 flex flex-wrap gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void voidReceipt(e.currentTarget, receipt._id);
                    }}
                  >
                    <Input
                      name="reason"
                      aria-label="Reason for voiding"
                      placeholder="Reason for voiding"
                      required
                      maxLength={200}
                      className="min-h-11 rounded-xl border border-border bg-surface px-3"
                    />
                    <Button type="submit" variant="secondary" isDisabled={busy}>
                      Void receipt
                    </Button>
                  </Form>
                </details>
              )}
            </article>
          )}
        />
      </section>
    </div>
  );
}
