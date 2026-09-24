import type { OrderTrackingView } from "@repo/api";
import { mapCustomerOrder, useApp } from "@/context/AppContext";
import { formatEtaRange, isEtaStale } from "@/lib/eta";
import Link from "next/link";
export function TrackingOrderDetails({
  data,
  now,
}: {
  data: OrderTrackingView;
  now: number;
}) {
  const { t, language } = useApp();
  const de = language === "de",
    order = mapCustomerOrder(data.order);
  return (
    <>
      <h2>{t("tracking.estimate")}</h2>
      <p className="tracking-eta">
        {order.status === "completed"
          ? t("tracking.arrived")
          : formatEtaRange(order.eta, t)}
      </p>
      {order.eta.computedAt && isEtaStale(order.eta.computedAt, now) && (
        <p>{t("tracking.etaStale")}</p>
      )}
      {order.isScheduled && order.scheduledAt && (
        <p>
          {de ? "Startzeit" : "Order starts"}:{" "}
          {new Date(order.scheduledAt).toLocaleString()}
        </p>
      )}
      {order.deliveryWindowStart && order.deliveryWindowEnd && (
        <p>
          {t("payment.arrivalWindow")}:{" "}
          {new Date(order.deliveryWindowStart).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          –
          {new Date(order.deliveryWindowEnd).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      {order.promisedDeliveryAt && (
        <p>
          {de ? "Ursprüngliche Lieferzusage" : "Original delivery promise"}:{" "}
          {new Date(order.promisedDeliveryAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      <h2>{t("tracking.deliveryAddress")}</h2>
      <p>{order.deliveryAddress || t("tracking.savedAddress")}</p>
      {order.deliveryInstructions && <p>{order.deliveryInstructions}</p>}
      {order.leaveAtDoor && <p>{t("tracking.leaveAtDoorNote")}</p>}
      {order.deliveryPin && order.status === "active" && (
        <div className="tracking-pin">
          <h2>{t("tracking.pinTitle")}</h2>
          <strong data-testid="delivery-pin">{order.deliveryPin}</strong>
          <p>{t("tracking.pinBodyWithCode", { pin: order.deliveryPin })}</p>
        </div>
      )}
      {order.hasShortExtraStop && <p>{t("tracking.delayNotice")}</p>}
      <Link href={`/help/?order=${encodeURIComponent(order.id)}`}>
        {de ? "Hilfe zur Bestellung" : "Help with this order"}
      </Link>
    </>
  );
}
