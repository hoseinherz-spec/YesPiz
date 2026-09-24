"use client";
import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";
type Timeline = {
  _id: string;
  status: string;
  paymentStatus: string;
  refundStatus?: string;
  createdAt?: string;
  scheduledAt?: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  promisedDeliveryAt?: string;
};
type Notification = {
  _id: string;
  deliveryStatus: string;
  attempts: number;
  nextAttemptAt: string;
  lastError?: string;
};
const stages = [
  ["createdAt", "Order created"],
  ["scheduledAt", "Scheduled start"],
  ["acceptedAt", "Kitchen accepted"],
  ["preparingAt", "Preparation started"],
  ["readyAt", "Ready for pickup"],
  ["pickedUpAt", "Courier pickup"],
  ["deliveredAt", "Delivered"],
  ["completedAt", "Completed"],
] as const;
export default function OrderToolsPage() {
  const [id, setId] = useState(() =>
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("orderId") || "",
    ),
    [order, setOrder] = useState<Timeline | null>(null),
    [notifications, setNotifications] = useState<Notification[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setNotifications(
        await apiRequest<Notification[]>(
          "/api/v1/operations/notifications",
          withAuth({ accessToken: requireAdminToken(), method: "GET" }),
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load delivery queue.",
      );
    }
  }, []);
  useLoadOnMount(load);
  async function inspect() {
    setBusy(true);
    setError("");
    try {
      setOrder(
        await apiRequest<Timeline>(
          `/api/v1/operations/orders/${id}`,
          withAuth({ accessToken: requireAdminToken(), method: "GET" }),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to find order.");
    } finally {
      setBusy(false);
    }
  }
  async function retry(notification: Notification) {
    setBusy(true);
    try {
      await apiRequest(
        `/api/v1/operations/notifications/${notification._id}/retry`,
        withAuth({
          accessToken: requireAdminToken(),
          method: "POST",
          body: {},
        }),
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Order operations</h1>
      <p className="text-sm text-muted">
        Inspect recorded milestones and recover failed notifications. Original
        delivery promises stay visible.
      </p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void inspect();
        }}
      >
        <label className="text-sm">
          Order ID
          <input
            required
            pattern="[a-fA-F0-9]{24}"
            className="mt-2 block min-h-12 rounded-xl border border-border bg-surface px-3"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </label>
        <Button type="submit" isDisabled={busy}>
          Inspect order
        </Button>
      </form>
      {order && (
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">
            #{order._id.slice(-6)} · {order.status}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Payment: {order.paymentStatus} · Refund:{" "}
            {order.refundStatus ?? "None"}
          </p>
          {order.promisedDeliveryAt && (
            <p className="mt-4 text-sm">
              Original promise:{" "}
              {new Date(order.promisedDeliveryAt).toLocaleString()}
            </p>
          )}
          <ol className="mt-4 space-y-3">
            {stages.map(
              ([field, label]) =>
                order[field] && (
                  <li
                    key={field}
                    className="border-l-2 border-accent py-2 pl-4"
                  >
                    <strong className="block text-sm">{label}</strong>
                    <time className="text-xs text-muted">
                      {new Date(order[field]!).toLocaleString()}
                    </time>
                  </li>
                ),
            )}
          </ol>
        </section>
      )}
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notification queue</h2>
          <Button variant="secondary" onPress={() => void load()}>
            Refresh
          </Button>
        </div>
        {!notifications.length && (
          <p className="mt-4 text-sm text-muted">
            No queued or failed notifications. External delivery is disabled in
            the mock preview.
          </p>
        )}
        {notifications.map((n) => (
          <article
            key={n._id}
            className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
          >
            <div>
              <strong className="text-sm">
                {n.deliveryStatus} · {n.attempts} attempts
              </strong>
              <p className="text-xs text-muted">
                Next attempt: {new Date(n.nextAttemptAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="secondary"
              isDisabled={busy || n.deliveryStatus !== "failed"}
              onPress={() => void retry(n)}
            >
              Retry failed delivery
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
}
