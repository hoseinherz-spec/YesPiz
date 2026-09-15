"use client";
import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";
type Window = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacityUnits: number;
  maxOrders: number;
  leadMinutes: number;
  revision: number;
  usedOrders: number;
  usedUnits: number;
};
const localTime = (value: string) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export function DeliveryWindowManager() {
  const [rows, setRows] = useState<Window[]>([]),
    [editing, setEditing] = useState<Window | null>(null),
    [removing, setRemoving] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setRows(
        await apiRequest<Window[]>(
          "/api/v1/delivery-slots/manage",
          withAuth({ accessToken: requireAdminToken(), method: "GET" }),
        ),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load windows.");
    }
  }, []);
  useLoadOnMount(load);
  async function save(row: Window, form?: HTMLFormElement) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const f = form ? new FormData(form) : null;
      await apiRequest(
        `/api/v1/delivery-slots/${row.id}`,
        withAuth({
          accessToken: requireAdminToken(),
          method: f ? "PATCH" : "DELETE",
          body: f
            ? {
                revision: row.revision,
                startsAt: new Date(String(f.get("start"))).toISOString(),
                endsAt: new Date(String(f.get("end"))).toISOString(),
                capacityUnits: Number(f.get("capacity")),
                maxOrders: Number(f.get("orders")),
                leadMinutes: Number(f.get("lead")),
              }
            : { revision: row.revision },
        }),
      );
      setEditing(null);
      setRemoving(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update window.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex justify-between gap-3">
        <h2 className="text-lg font-semibold">Manage delivery windows</h2>
        <Button
          variant="secondary"
          isDisabled={busy}
          onPress={() => void load()}
        >
          Refresh windows
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted">
        Reserved windows keep their promised times. Capacity cannot be reduced
        below reservations.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl bg-surface-secondary p-4"
          >
            <p className="font-semibold">
              {new Date(row.startsAt).toLocaleString()} –{" "}
              {new Date(row.endsAt).toLocaleTimeString()}
            </p>
            <p className="mt-1 text-sm text-muted">
              {row.usedUnits}/{row.capacityUnits} pizzas · {row.usedOrders}/
              {row.maxOrders} deliveries reserved
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                isDisabled={busy}
                onPress={() => {
                  setEditing(row);
                  setRemoving(null);
                }}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                isDisabled={busy || row.usedOrders > 0}
                onPress={() => setRemoving(row.id)}
              >
                Remove
              </Button>
            </div>
            {removing === row.id && (
              <div className="mt-3">
                <p>Remove this unreserved window?</p>
                <Button isDisabled={busy} onPress={() => void save(row)}>
                  Confirm removal
                </Button>
                <Button variant="ghost" onPress={() => setRemoving(null)}>
                  Keep window
                </Button>
              </div>
            )}
            {editing?.id === row.id && (
              <form
                className="mt-4 grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save(row, e.currentTarget);
                }}
              >
                {[
                  {
                    name: "start",
                    label: "Arrival from",
                    type: "datetime-local",
                    value: localTime(row.startsAt),
                  },
                  {
                    name: "end",
                    label: "Arrival until",
                    type: "datetime-local",
                    value: localTime(row.endsAt),
                  },
                  {
                    name: "capacity",
                    label: "Pizza capacity",
                    type: "number",
                    value: row.capacityUnits,
                    min: Math.max(1, row.usedUnits),
                    max: 500,
                  },
                  {
                    name: "orders",
                    label: "Delivery capacity",
                    type: "number",
                    value: row.maxOrders,
                    min: Math.max(1, row.usedOrders),
                    max: 100,
                  },
                  {
                    name: "lead",
                    label: "Preparation lead (minutes)",
                    type: "number",
                    value: row.leadMinutes,
                    min: 20,
                    max: 120,
                  },
                ].map((f) => (
                  <label key={f.name} className="text-sm">
                    {f.label}
                    <input
                      required
                      name={f.name}
                      type={f.type}
                      defaultValue={f.value}
                      min={f.min}
                      max={f.max}
                      readOnly={
                        row.usedOrders > 0 &&
                        ["start", "end", "lead"].includes(f.name)
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3"
                    />
                  </label>
                ))}
                <Button type="submit" isDisabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => setEditing(null)}
                  isDisabled={busy}
                >
                  Cancel
                </Button>
              </form>
            )}
          </article>
        ))}
      </div>
      {!rows.length && !error && (
        <p className="mt-4 text-sm text-muted">No upcoming windows.</p>
      )}
    </section>
  );
}
