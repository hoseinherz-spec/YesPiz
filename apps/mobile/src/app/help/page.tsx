"use client";
import { AppText } from "@/components/Text";

import { Form, Select, RadioField, TextArea } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import {
  careClient,
  ordersClient,
  type SupportRequest,
  type CustomerOrderView,
} from "@repo/api";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { EmptyState } from "@/components/EmptyState";
import {
  Heart,
  Clock,
  ShoppingBag,
  Wallet,
  MessageCircle,
  Check,
} from "@repo/icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { hx } from "@/lib/heroui-classes";
export default function HelpPage() {
  const { accessToken, language } = useApp();
  const de = language === "de";
  const [orders, setOrders] = useState<CustomerOrderView[]>([]);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [orderId, setOrderId] = useState("");
  const [category, setCategory] = useState("quality");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const requestKey = useRef("");
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [allOrders, cases] = await Promise.all([
        ordersClient.list({ accessToken }),
        careClient.requests({ accessToken }),
      ]);
      setOrders(allOrders);
      setRequests(cases);
      setError("");
      setOrderId(
        (old) =>
          old ||
          new URLSearchParams(window.location.search).get("order") ||
          allOrders[0]?.id ||
          "",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  useEffect(() => {
    void Promise.resolve().then(load);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);
  async function submit() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    requestKey.current ||= crypto.randomUUID();
    try {
      const created = await careClient.create(
        {
          orderId,
          category,
          message: message.trim(),
          requestKey: requestKey.current,
        },
        { accessToken },
      );
      setRequests((old) => [
        created,
        ...old.filter((row) => row.id !== created.id),
      ]);
      setMessage("");
      requestKey.current = "";
      setNotice(
        de
          ? "Deine Anfrage wurde gespeichert."
          : "Your request has been received.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to send. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  const topics = [
    {
      value: "quality",
      label: de ? "Pizzaqualität" : "Pizza quality",
      icon: Heart,
    },
    { value: "late", label: de ? "Verspätung" : "Late delivery", icon: Clock },
    {
      value: "missing",
      label: de ? "Falsche Pizza" : "Wrong or missing",
      icon: ShoppingBag,
    },
    {
      value: "payment",
      label: de ? "Zahlung" : "Payment or refund",
      icon: Wallet,
    },
    {
      value: "other",
      label: de ? "Anderes" : "Something else",
      icon: MessageCircle,
    },
  ];
  const field =
    "mt-2 w-full rounded-2xl bg-field-background p-4 text-foreground focus-visible:outline-focus";
  return (
    <AppFrame className="reference-screen">
      <ScreenHeader
        title={de ? "Yespizz hilft dir" : "Here for your pizza order"}
      />
      <AppText as="p" className="mt-3 text-sm leading-6 text-muted">
        {de
          ? "Etwas stimmt nicht? Melde dich direkt bei Yespizz – auch nach der Lieferung."
          : "Something not right? Reach Yespizz directly, even after delivery."}
      </AppText>
      {error && (
        <AppText as="p" role="alert" className="my-4 text-danger">
          {error}{" "}
          <FormButton
            variant="ghost"
            type="button"
            className="underline"
            onPress={() => void load()}
          >
            Retry
          </FormButton>
        </AppText>
      )}
      {notice && (
        <AppText as="p" role="status" className="my-4 rounded-2xl bg-surface-secondary p-4">
          {notice}
        </AppText>
      )}
      {!accessToken ? (
        <EmptyState
          icon={<MessageCircle size={28} />}
          title={de ? "Wir sind für dich da" : "Let’s sort it out"}
          body={
            de
              ? "Melde dich an, um eine Bestellung auszuwählen und uns zu schreiben."
              : "Sign in to choose an order and tell us what happened."
          }
          actionLabel={de ? "Anmelden" : "Sign in for order support"}
          actionHref="/login/?next=/help/"
        />
      ) : loading ? (
        <AppText as="p" className="my-8" role="status">
          Loading orders…
        </AppText>
      ) : (
        <>
          {orders.length ? (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="mt-6 space-y-5"
            >
              <Select
                label={<>{de ? "Bestellung" : "Order"}</>}
                wrapperClassName="block text-sm font-semibold"
                required
                className={field}
                disabled={busy}
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  requestKey.current = "";
                }}
              >
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.id.slice(-6)} ·{" "}
                    {order.lines
                      .map((line) => `${line.quantity} × ${line.name}`)
                      .join(", ")}
                  </option>
                ))}
              </Select>
              <RadioField
                name="support-topic"
                label={de ? "Was ist passiert?" : "What happened?"}
                required
                disabled={busy}
                value={category}
                onChange={(value) => {
                  setCategory(value as typeof category);
                  requestKey.current = "";
                }}
                options={topics.map(({ value, label, icon: Icon }) => ({
                  id: value,
                  label: (
                    <AppText as="span" className="flex items-center gap-3">
                      <Icon size={21} />
                      {label}
                    </AppText>
                  ),
                }))}
              />
              <TextArea
                label={<>{de ? "Details" : "Tell us more"}</>}
                wrapperClassName="block text-sm font-semibold"
                required
                minLength={5}
                maxLength={2000}
                disabled={busy}
                className={`${field} min-h-28`}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  requestKey.current = "";
                }}
              />
              <Button
                fullWidth
                className={hx.btnPrimary}
                type="submit"
                isDisabled={
                  busy ||
                  message.trim().length < 5 ||
                  !orders.some((order) => order.id === orderId)
                }
              >
                {busy
                  ? de
                    ? "Wird gesendet…"
                    : "Sending…"
                  : de
                    ? "Hilfe anfordern"
                    : "Send to Yespizz"}
              </Button>
            </Form>
          ) : (
            <div className="my-8 rounded-[28px] bg-surface-secondary p-6">
              <AppText as="p">
                {de
                  ? "Deine Bestellungen erscheinen hier."
                  : "Your pizza orders will appear here."}
              </AppText>
              <Link href="/menu/" className="mt-4 inline-block underline">
                {de ? "Pizzen entdecken" : "Explore pizzas"}
              </Link>
            </div>
          )}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <AppText as="h2" className="text-xl font-bold">
                {de ? "Deine Anfragen" : "Your requests"}
              </AppText>
              <Button variant="ghost" onPress={() => void load()}>
                {de ? "Aktualisieren" : "Refresh"}
              </Button>
            </div>
            {!requests.length && (
              <AppText as="p" className="mt-3 text-sm text-muted">
                {de ? "Noch keine Anfragen." : "No support requests yet."}
              </AppText>
            )}
            <div className="mt-4 space-y-3">
              {requests.map((row) => (
                <article
                  key={row.id}
                  className="data-surface rounded-[24px] p-5"
                >
                  <div className="flex justify-between gap-3 text-sm">
                    <AppText as="strong">#{row.orderId.slice(-6)}</AppText>
                    <AppText as="span"
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${row.status === "resolved" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}
                    >
                      {row.status === "resolved" ? (
                        <Check size={13} />
                      ) : (
                        <Clock size={13} />
                      )}
                      {row.status === "resolved"
                        ? de
                          ? "Abgeschlossen"
                          : "Resolved"
                        : de
                          ? "In Bearbeitung"
                          : "In progress"}
                    </AppText>
                  </div>
                  <AppText as="p" className="mt-3 whitespace-pre-wrap break-words text-sm">
                    {row.message}
                  </AppText>
                  <AppText as="p" className="mt-4 border-t border-border pt-3 text-sm leading-6 text-muted">
                    {row.response}
                  </AppText>
                  <AppText as="p" className="mt-2 text-xs text-muted">
                    {new Date(row.createdAt).toLocaleString()}
                  </AppText>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AppFrame>
  );
}
