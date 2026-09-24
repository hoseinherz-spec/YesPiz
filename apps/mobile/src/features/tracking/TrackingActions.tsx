"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ordersClient,
  paymentsClient,
  type OrderTrackingView,
} from "@repo/api";
import { Phone, MessageCircle, X } from "@/components/animated-icon/icons";
import { ReferenceSheet } from "@/components/ReferenceSheet";
import { useApp } from "@/context/AppContext";
export function TrackingActions({
  data,
  accessToken,
  refresh,
  de,
}: {
  data: OrderTrackingView;
  accessToken: string;
  refresh: () => void;
  de: boolean;
}) {
  const router = useRouter();
  const { setActiveOrderId, refreshOrders } = useApp();
  const [cancel, setCancel] = useState(false),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState("");
  const active = data.order.orderState === "active";
  async function call() {
    setBusy(true);
    setMessage("");
    try {
      const response = await ordersClient.callCourier(data.order.id, {
        accessToken,
      });
      setMessage(response.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Call unavailable. Please use chat.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    setMessage("");
    try {
      await paymentsClient.cancel(data.order.id, reason.trim(), {
        accessToken,
      });
      setCancel(false);
      refresh();
      await refreshOrders();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to cancel order.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {message && (
        <p className="tracking-action-message" role="status">
          {message}
        </p>
      )}
      <div className="tracking-action-bar">
        <button
          className="tracking-cancel"
          disabled={busy || !active}
          onClick={() => {
            setMessage("");
            setCancel(true);
          }}
        >
          <X size={25} />
          {de ? "Stornieren" : "Cancel"}
        </button>
        <button
          disabled={busy || !active || !data.rider}
          onClick={() => void call()}
          aria-label={de ? "Fahrer anrufen" : "Call rider"}
        >
          <Phone size={20} aria-hidden="true" />
          <span>{de ? "Anrufen" : "Call"}</span>
        </button>
        <button
          disabled={!active || !data.rider}
          onClick={() => {
            setActiveOrderId(data.order.id);
            router.push("/chat/");
          }}
          aria-label={de ? "Fahrer anschreiben" : "Chat with rider"}
        >
          <MessageCircle size={20} aria-hidden="true" />
          <span>Chat</span>
        </button>
      </div>
      <ReferenceSheet
        open={cancel}
        onClose={() => {
          if (!busy) setCancel(false);
        }}
        title={de ? "Bestellung stornieren" : "Cancel order"}
      >
        {data.order.canCancel ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy && reason.trim().length >= 3) void confirm();
            }}
          >
            <p>
              {de
                ? "Möchtest du diese Bestellung stornieren?"
                : "Cancel this order? Eligible card payments will be refunded to the original payment method."}
            </p>
            <label className="tracking-reason">
              {de ? "Grund" : "Reason"}
              <textarea
                required
                minLength={3}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <button
              className="tracking-confirm"
              disabled={busy || reason.trim().length < 3}
              type="submit"
            >
              {busy
                ? de
                  ? "Bitte warten…"
                  : "Cancelling…"
                : de
                  ? "Stornierung bestätigen"
                  : "Confirm cancellation"}
            </button>
          </form>
        ) : (
          <>
            <p>
              {de
                ? "Die Zubereitung hat bereits begonnen. Bitte kontaktiere den Support."
                : "Preparation has started, so cancellation is no longer available. Contact support for help."}
            </p>
            <button
              onClick={() =>
                router.push(`/help/?order=${encodeURIComponent(data.order.id)}`)
              }
            >
              {de ? "Support kontaktieren" : "Contact support"}
            </button>
          </>
        )}
        {message && <p role="alert">{message}</p>}
      </ReferenceSheet>
    </>
  );
}
