"use client";
import { AppText } from "@/components/Text";


import Link from "next/link";
import { ArrowRight, ShoppingBag } from "@/components/animated-icon/icons";
import { useApp } from "@/context/AppContext";
import { OrderProgress } from "./OrderProgress";

export function HomeOrderCard() {
  const { orders, hydrated, setActiveOrderId, t, language } = useApp();
  const order = [...orders]
    .filter((item) => item.status === "active")
    .sort((a, b) => b.placedAt - a.placedAt)[0];
  if (!hydrated || !order) return null;
  const de = language === "de";
  return (
    <section
      className="data-surface mt-6 rounded-[28px] p-4"
      aria-label={de ? "Aktuelle Bestellung" : "Current order"}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ShoppingBag size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <AppText as="p" className="text-xs text-muted">
            {de ? "Aktuelle Bestellung" : "Current order"}
          </AppText>
          <AppText as="p" className="mt-1 truncate text-sm font-semibold">
            {order.items
              .map((item) => `${item.quantity}× ${item.name}`)
              .join(" · ")}
          </AppText>
        </div>
      </div>
      {!order.awaitingPayment && (
        <OrderProgress stepIndex={order.stepIndex} compact />
      )}
      <Link
        href={
          order.awaitingPayment
            ? `/payment/?orderId=${encodeURIComponent(order.id)}`
            : "/tracking/"
        }
        onClick={() => setActiveOrderId(order.id)}
        className="mt-4 flex min-h-11 items-center justify-between rounded-2xl bg-surface-tertiary px-4 text-sm font-semibold outline-none transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-focus"
      >
        {order.awaitingPayment
          ? de
            ? "Zahlung fortsetzen"
            : "Resume payment"
          : t("orders.track")}
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}

export function LastOrderRail() {
  const { orders, hydrated, language, user } = useApp();
  if (!hydrated || !user) return null;
  const previous = [...orders]
    .filter((order) => order.status === "completed")
    .sort((a, b) => b.placedAt - a.placedAt)
    .slice(0, 4);
  if (!previous.length) return null;
  const de = language === "de";
  return (
    <section className="mt-7" aria-label={de ? "Letzte Bestellungen" : "Recent orders"}>
      <h2 className="text-xl font-bold">{de ? "Nochmal bestellen" : "Order it again"}</h2>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
        {previous.map((order) => (
          <Link key={order.id} href="/orders/" className="data-surface min-w-[72%] snap-start rounded-[24px] p-4">
            <span className="text-xs text-muted">{new Date(order.placedAt).toLocaleDateString(de ? "de-DE" : "en-IE")}</span>
            <strong className="mt-2 block line-clamp-2 text-sm">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}</strong>
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold">{de ? "Bestellung ansehen" : "View order"}<ArrowRight size={15} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
