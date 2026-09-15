"use client";
import { RewardPolicyEditor } from "@/components/RewardPolicyEditor";
import { DeliveryWindowManager } from "@/components/DeliveryWindowManager";
import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import {
  apiRequest,
  withAuth,
  slotsClient,
  type DeliverySlot,
} from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";
type Insights = {
  customerMetrics: {
    customers: number;
    repeatCustomers: number;
    orders: number;
    paidCents: number;
    averagePaidCents: number;
  };
  funnel: { _id: string; sessions: number }[];
  orders: { _id: string; count: number; totalCents: number }[];
  kitchens: {
    _id: string;
    samples: number;
    actualPrepMinutes: number;
    quotedPrepMinutes: number;
  }[];
  atRisk: { _id: string; status: string; promisedDeliveryAt: string }[];
};
export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null),
    [slots, setSlots] = useState<DeliverySlot[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        apiRequest<Insights>(
          "/api/v1/insights",
          withAuth({ accessToken: requireAdminToken(), method: "GET" }),
        ),
        slotsClient.list(),
      ]);
      setData(d);
      setSlots(s);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load insights.");
    }
  }, []);
  useLoadOnMount(load);
  async function create(form: HTMLFormElement) {
    setBusy(true);
    try {
      const f = new FormData(form);
      await slotsClient.create(
        {
          startsAt: new Date(String(f.get("start"))).toISOString(),
          endsAt: new Date(String(f.get("end"))).toISOString(),
          capacityUnits: Number(f.get("units")),
          maxOrders: Number(f.get("orders")),
          leadMinutes: Number(f.get("lead")),
        },
        { accessToken: requireAdminToken() },
      );
      await load();
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save window.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service & growth</h1>
          <p className="text-sm text-muted">
            Last 30 days · measured outcomes and delivery capacity
          </p>
        </div>
        <Button onPress={() => void load()}>Refresh</Button>
      </header>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Completed paid orders",
                value: data.customerMetrics.orders,
              },
              {
                label: "Repeat customers this period",
                value: `${data.customerMetrics.repeatCustomers} / ${data.customerMetrics.customers}`,
              },
              {
                label: "Average paid order",
                value: new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "EUR",
                }).format(data.customerMetrics.averagePaidCents / 100),
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl border border-border bg-card p-5"
              >
                <p className="text-xs text-muted">{metric.label}</p>
                <strong className="mt-2 block text-2xl">{metric.value}</strong>
              </div>
            ))}
          </section>
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Ordering journey</h2>
            <p className="mb-4 text-xs text-muted">
              Unique opted-in browser sessions per step. These are not a
              sequential conversion cohort.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "menu_view",
                "product_view",
                "cart_add",
                "cart_view",
                "checkout_view",
                "payment_view",
              ].map((event) => (
                <div
                  key={event}
                  className="rounded-2xl bg-surface-secondary p-4"
                >
                  <p className="text-xs text-muted">
                    {event.replaceAll("_", " ")}
                  </p>
                  <strong className="text-2xl">
                    {data.funnel.find((x) => x._id === event)?.sessions ?? 0}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Orders needing attention</h2>
            {!data.atRisk.length ? (
              <p className="mt-3 text-sm text-muted">
                No active orders beyond their original promise.
              </p>
            ) : (
              data.atRisk.map((o) => (
                <div
                  key={o._id}
                  className="mt-3 flex flex-wrap justify-between gap-2 border-b border-border py-3"
                >
                  <span>
                    #{o._id.slice(-6)} · {o.status}
                  </span>
                  <time>{new Date(o.promisedDeliveryAt).toLocaleString()}</time>
                </div>
              ))
            )}
          </section>
          <section className="overflow-x-auto rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Preparation performance</h2>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Kitchen</th>
                  <th>Samples</th>
                  <th>Actual minutes</th>
                  <th>Quoted minutes</th>
                </tr>
              </thead>
              <tbody>
                {data.kitchens.map((k) => (
                  <tr key={k._id} className="border-t border-border">
                    <td className="py-3">{k._id}</td>
                    <td>{k.samples}</td>
                    <td>{k.actualPrepMinutes.toFixed(1)}</td>
                    <td>{k.quotedPrepMinutes?.toFixed(1) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
      <RewardPolicyEditor />
      <DeliveryWindowManager />
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Open a delivery window</h2>
        <p className="mt-2 text-sm text-muted">
          Only publish capacity confirmed with kitchens and couriers. Order and
          pizza limits are enforced together.
        </p>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void create(e.currentTarget);
          }}
        >
          {[
            { name: "start", label: "Arrival from", type: "datetime-local" },
            { name: "end", label: "Arrival until", type: "datetime-local" },
            {
              name: "units",
              label: "Pizza capacity",
              type: "number",
              value: 20,
            },
            {
              name: "orders",
              label: "Courier delivery capacity",
              type: "number",
              value: 5,
            },
            {
              name: "lead",
              label: "Preparation and route lead (minutes)",
              type: "number",
              value: 45,
            },
          ].map((f) => (
            <label key={f.name} className="text-sm">
              {f.label}
              <input
                name={f.name}
                type={f.type}
                required
                defaultValue={f.value}
                min={1}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3"
              />
            </label>
          ))}
          <Button type="submit" isDisabled={busy}>
            Publish window
          </Button>
        </form>
        <div className="mt-5 space-y-2">
          {slots.map((s) => (
            <p
              key={s.id}
              className="rounded-xl bg-surface-secondary p-3 text-sm"
            >
              {new Date(s.startsAt).toLocaleString()} –{" "}
              {new Date(s.endsAt).toLocaleTimeString()} · {s.remainingUnits}{" "}
              pizzas / {s.remainingOrders} deliveries left
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
