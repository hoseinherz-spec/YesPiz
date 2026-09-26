"use client";
import { DataList } from "@/components/AdminTable";
import {
  FormAction,
  FormScope,
  Input,
  TextArea,
} from "@/components/AdminForms";

import { careClient, type AdminSupportRequest } from "@repo/api";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
export default function SupportPage() {
  const [rows, setRows] = useState<AdminSupportRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState(false);
  const [selected, setSelected] = useState<AdminSupportRequest | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const inFlight = useRef(false);
  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setRows(await careClient.queue({ accessToken: requireAdminToken() }));
      setLoaded(true);
      setUpdatedAt(new Date().toLocaleTimeString());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load requests.");
    } finally {
      inFlight.current = false;
    }
  }, []);
  useEffect(() => {
    // Defer initial loading so synchronous auth/storage failures update after the effect.
    void Promise.resolve().then(load);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);
  async function claim(row: AdminSupportRequest) {
    setBusy(true);
    setError("");
    try {
      setSelected(
        await careClient.claim(row._id, { accessToken: requireAdminToken() }),
      );
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to claim.");
    } finally {
      setBusy(false);
    }
  }
  async function resolve(status: "investigating" | "resolved") {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await careClient.resolve(
        selected._id,
        {
          revision: selected.revision,
          status,
          response: status,
          internalNote: note,
        },
        { accessToken: requireAdminToken() },
      );
      setSelected(null);
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy(false);
    }
  }
  const open = rows.filter((row) => row.status !== "resolved");
  const visible = rows
    .filter(
      (row) =>
        (closed || row.status !== "resolved") &&
        `${row.orderId} ${row.category} ${row.message}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  return (
    <FormScope>
      {
        <div className="mx-auto max-w-5xl space-y-6">
          <header>
            <p className="text-sm text-muted">Customer care</p>
            <h1 className="mt-2 text-3xl font-semibold">
              Every order has an owner
            </h1>
            <p className="mt-3 text-sm text-muted">
              {open.length} open requests ·{" "}
              {updatedAt ? `Updated ${updatedAt}` : "Loading queue"}
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              aria-label="Search support"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, issue or customer message"
              className="min-w-60 flex-1 rounded-xl bg-field-background p-3"
            />
            <Input
              label={<>Include resolved</>}
              wrapperClassName="flex gap-2 text-sm"
              type="checkbox"
              checked={closed}
              onChange={(e) => setClosed(e.target.checked)}
            />
            <Button variant="secondary" onPress={() => void load()}>
              Refresh
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          {selected && (
            <FormScope>
              <section
                className="space-y-4 rounded-3xl border border-border p-6"
                aria-label="Review support request"
              >
                <h2 className="text-xl font-semibold">
                  Review #{selected.orderId.slice(-6)}
                </h2>
                <p className="whitespace-pre-wrap">{selected.message}</p>
                <TextArea
                  label={
                    <>Internal review note · never shared with the customer</>
                  }
                  wrapperClassName="block text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  className="mt-2 min-h-28 w-full rounded-xl bg-field-background p-3"
                />
                <p className="text-sm text-muted">
                  Changing status does not issue a refund. Use{" "}
                  <Link className="underline" href="/refunds">
                    refund reconciliation
                  </Link>{" "}
                  to verify payment outcomes.
                </p>
                <div className="flex flex-wrap gap-3">
                  <FormAction
                    isDisabled={busy || note.trim().length < 5}
                    variant="secondary"
                    onPress={() => void resolve("investigating")}
                  >
                    Mark investigating
                  </FormAction>
                  <FormAction
                    isDisabled={busy || note.trim().length < 5}
                    onPress={() => void resolve("resolved")}
                  >
                    Resolve request
                  </FormAction>
                  <Button
                    isDisabled={busy}
                    variant="ghost"
                    onPress={() => setSelected(null)}
                  >
                    Close
                  </Button>
                </div>
              </section>
            </FormScope>
          )}
          {loaded && !visible.length && (
            <p className="rounded-3xl bg-card p-8 text-muted">
              No requests match this view.
            </p>
          )}
          <DataList
            data={visible}
            label="support"
            renderItem={(row) => (
              <article key={row._id} className="rounded-2xl bg-card p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      #{row.orderId.slice(-6)} · {row.category}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {row.status} · {row.ownerId ? "Assigned" : "Unassigned"} ·
                      Due {new Date(row.dueAt).toLocaleString()}
                    </p>
                  </div>
                  {row.status !== "resolved" && (
                    <Button
                      isDisabled={busy}
                      variant="secondary"
                      onPress={() => void claim(row)}
                    >
                      Claim & review
                    </Button>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                  {row.message}
                </p>
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-muted">
                    Internal history ({row.events.length})
                  </summary>
                  {row.events.map((event, i) => (
                    <p
                      key={i}
                      className="mt-2 whitespace-pre-wrap border-l border-border pl-3"
                    >
                      {new Date(event.at).toLocaleString()} · {event.action}
                      {event.internalNote ? ` — ${event.internalNote}` : ""}
                    </p>
                  ))}
                </details>
              </article>
            )}
          />
        </div>
      }
    </FormScope>
  );
}
