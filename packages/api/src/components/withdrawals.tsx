"use client";
import { FormAction, FormScope, Form, TextArea, Input } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../core";
type Withdrawal = {
  _id: string;
  party?: string;
  payeeId?: string;
  amountCents: number;
  status: string;
  revision: number;
  payoutDetails: string;
  paymentReference?: string;
  createdAt: string;
  history: Array<{ at: string; status: string; note: string }>;
};
const money = (cents: number) => `€${(cents / 100).toFixed(2)}`;
const input = "mt-2 w-full rounded-xl border border-border bg-background p-3";
export function Withdrawals({
  party,
  accessToken,
  onChanged,
}: {
  party: "provider" | "courier" | "admin";
  accessToken: string | null;
  onChanged?: () => Promise<void>;
}) {
  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [error, setError] = useState("");
  const [details, setDetails] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const path = `/api/v1/finance/${party}/withdrawals`;
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setRows(
        await apiRequest<Withdrawal[]>(path, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load withdrawals.");
    }
  }, [accessToken, path]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  return (
    <section className="space-y-4 rounded-3xl border border-border p-5">
      <div className="flex justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {party === "admin" ? "Withdrawal requests" : "Request a withdrawal"}
        </h2>
        <FormButton
          variant="ghost"
          type="button"
          className="underline"
          onPress={() => void load()}
        >
          Refresh
        </FormButton>
      </div>
      <p className="text-sm text-muted">
        {party === "admin"
          ? "Review the reserved amount, pay outside the app, then record the payment reference."
          : "Orders are collected by Yespizz. Request your approved, due balance below; platform administrators pay manually."}
      </p>
      {party !== "admin" && (
        <Form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!accessToken) return;
            setBusy(true);
            setError("");
            const requestKey = key || crypto.randomUUID();
            setKey(requestKey);
            try {
              await apiRequest(path, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: { requestKey, payoutDetails: details },
              });
              setKey("");
              setDetails("");
              await load();
              await onChanged?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Request failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <TextArea
            label={<>Account holder and bank payment details</>}
            wrapperClassName="block text-sm"
            required
            minLength={10}
            maxLength={500}
            className={input}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <FormButton
            variant="ghost"
            type="submit"
            isDisabled={
              busy ||
              rows.some((r) =>
                ["pending", "approved", "paying"].includes(r.status),
              )
            }
            className="rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Request full available balance"}
          </FormButton>
        </Form>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {!rows.length && (
        <p className="text-sm text-muted">No withdrawal requests yet.</p>
      )}
      {rows.map((row) => (
        <article key={row._id} className="rounded-2xl bg-card p-4">
          <div className="flex justify-between gap-3">
            <strong>{money(row.amountCents)}</strong>
            <span>{row.status}</span>
          </div>
          {party === "admin" && (
            <p className="mt-2 break-all text-xs text-muted">
              {row.party} · {row.payeeId}
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {row.payoutDetails}
          </p>
          {row.paymentReference && (
            <p className="mt-2 text-sm">
              Payment reference: {row.paymentReference}
            </p>
          )}
          <details className="mt-3 text-xs">
            <summary>Request history</summary>
            {row.history.map((h, i) => (
              <p className="mt-2" key={i}>
                {new Date(h.at).toLocaleString()} · {h.status} · {h.note}
              </p>
            ))}
          </details>
          {party === "admin" &&
            ["pending", "approved", "paying"].includes(row.status) && (
              <WithdrawalReview
                row={row}
                accessToken={accessToken}
                onSaved={async () => {
                  await load();
                  await onChanged?.();
                }}
              />
            )}
        </article>
      ))}
    </section>
  );
}
function WithdrawalReview({
  row,
  accessToken,
  onSaved,
}: {
  row: Withdrawal;
  accessToken: string | null;
  onSaved: () => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [reference, setReference] = useState(row.paymentReference ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function review(status: string) {
    if (!accessToken) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/api/v1/finance/admin/withdrawals/${row._id}/review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          revision: row.revision,
          status,
          note,
          paymentReference: status === "paid" ? reference : undefined,
        },
      });
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormScope>
      {
        <FormScope>
          <div className="mt-4 space-y-3">
            <TextArea
              label={<>Note visible to this partner</>}
              wrapperClassName="block text-sm"
              minLength={5}
              maxLength={500}
              className={input}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {row.status !== "pending" && (
              <>
                <Input
                  label={<>Actual bank transfer reference</>}
                  wrapperClassName="block text-sm"
                  className={input}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  readOnly={row.status === "paying"}
                />
                <Input
                  label={
                    <>
                      {" "}
                      I have made this payment and verified the amount and
                      recipient.
                    </>
                  }
                  wrapperClassName="flex items-center gap-2 text-sm"
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
              </>
            )}
            <div className="flex flex-wrap gap-2">
              {row.status === "pending" && (
                <FormAction
                  variant="ghost"
                  type="button"
                  isDisabled={busy || note.trim().length < 5}
                  className="rounded-xl bg-accent px-4 py-2 text-accent-foreground disabled:opacity-50"
                  onPress={() => void review("approved")}
                >
                  Approve request
                </FormAction>
              )}
              {row.status !== "paying" && (
                <FormAction
                  variant="ghost"
                  type="button"
                  isDisabled={busy || note.trim().length < 5}
                  className="rounded-xl border border-border px-4 py-2 disabled:opacity-50"
                  onPress={() => void review("rejected")}
                >
                  Reject request
                </FormAction>
              )}
              {row.status !== "pending" && (
                <FormAction
                  variant="ghost"
                  type="button"
                  isDisabled={
                    busy ||
                    !confirmed ||
                    reference.trim().length < 5 ||
                    note.trim().length < 5
                  }
                  className="rounded-xl bg-accent px-4 py-2 text-accent-foreground disabled:opacity-50"
                  onPress={() => void review("paid")}
                >
                  {row.status === "paying"
                    ? "Complete payment recording"
                    : "Record payment as paid"}
                </FormAction>
              )}
            </div>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </div>
        </FormScope>
      }
    </FormScope>
  );
}
