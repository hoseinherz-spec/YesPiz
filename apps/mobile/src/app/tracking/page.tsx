"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin } from "@/components/animated-icon/icons";
import { DeliveryTrackingMap } from "@repo/api/components/delivery-tracking-map";
import { useApp, ORDER_STEPS, mapCustomerOrder } from "@/context/AppContext";
import { useOrderTracking } from "@/features/tracking/useOrderTracking";
import { TrackingJourney } from "@/features/tracking/TrackingJourney";
import { RiderSheet } from "@/features/tracking/RiderSheet";
import { RiderAvatar } from "@/features/tracking/RiderAvatar";
import { TrackingActions } from "@/features/tracking/TrackingActions";
import { TrackingOrderDetails } from "@/features/tracking/TrackingOrderDetails";
import { PizzaLoader } from "@/components/PizzaLoader";
import { BrandLogo } from "@/components/BrandLogo";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { pizzaCraftAsset } from "@/constants/media";
import "@/features/tracking/tracking.css";

function TrackingScreen() {
  const { orders, activeOrderId, accessToken, hydrated, language, t } =
    useApp();
  const requestedId = useSearchParams().get("orderId");
  const [expanded, setExpanded] = useState(false),
    [recenter, setRecenter] = useState(0);
  const id =
    requestedId ||
    activeOrderId ||
    orders.find((order) => order.status === "active")?.id;
  const { data, loading, error, live, refresh, now } = useOrderTracking(
    id,
    accessToken,
  );
  const de = language === "de";
  const terminal = data && data.order.orderState !== "active";
  if (!hydrated || loading)
    return (
      <div className="tracking-fallback">
        <PizzaLoader
          size="lg"
          showLabel
          label={de ? "Bestellung wird geladen…" : "Loading your delivery…"}
        />
      </div>
    );
  if (
    !accessToken ||
    !id ||
    !data ||
    (terminal && data.order.orderState !== "completed")
  )
    return (
      <div className="tracking-fallback">
        <BrandLogo />
        <ProductImage
          src={pizzaCraftAsset("Scooter")}
          alt=""
          className="tracking-fallback-artwork"
        />
        <h1>
          {error
            ? de
              ? "Tracking nicht verfügbar"
              : "Tracking unavailable"
            : data?.order.orderState === "completed"
              ? t("tracking.arrived")
              : data?.order.orderState === "cancelled"
                ? t("orders.cancelled")
                : data?.order.orderState === "awaiting_payment"
                  ? de
                    ? "Zahlung offen"
                    : "Payment needed"
                  : t("tracking.noActive")}
        </h1>
        <p role={error ? "alert" : undefined}>
          {error ||
            (!accessToken
              ? de
                ? "Melde dich an, um deine Lieferung zu verfolgen."
                : "Sign in to track your delivery."
              : t("tracking.noActiveBody"))}
        </p>
        {error && (
          <button onClick={refresh}>
            {de ? "Erneut versuchen" : "Try again"}
          </button>
        )}
        <Link
          href={
            !accessToken
              ? `/auth/sign-in/?next=${encodeURIComponent(`/tracking/${id ? `?orderId=${encodeURIComponent(id)}` : ""}`)}`
              : data?.order.orderState === "awaiting_payment"
                ? `/payment/?orderId=${encodeURIComponent(data.order.id)}`
                : "/orders/"
          }
        >
          {!accessToken
            ? de
              ? "Anmelden"
              : "Sign in"
            : data?.order.orderState === "awaiting_payment"
              ? de
                ? "Jetzt bezahlen"
                : "Resume payment"
              : t("tracking.viewOrders")}
        </Link>
      </div>
    );
  if (data.order.customerStatus !== "onway")
    return (
      <main className="tracking-screen tracking-preparation">
        <TrackingJourney data={data} accessToken={accessToken} hero />
        {error && (
          <p role="alert" className="journey-error">
            {error}{" "}
            <button onClick={refresh}>
              {de ? "Erneut versuchen" : "Try again"}
            </button>
          </p>
        )}
        <div className="journey-details">
          <TrackingOrderDetails data={data} now={now} />
          {data.order.orderState === "completed" ? (
            <Link
              className="journey-complete-action"
              href={`/feedback/?order=${encodeURIComponent(data.order.id)}`}
            >
              {de ? "Bestellung bewerten" : "Rate your order"}
            </Link>
          ) : (
            <TrackingActions
              data={data}
              accessToken={accessToken}
              refresh={refresh}
              de={de}
            />
          )}
        </div>
      </main>
    );
  const order = mapCustomerOrder(data.order);
  const step =
    ORDER_STEPS[
      Math.max(0, Math.min(order.stepIndex, ORDER_STEPS.length - 1))
    ]!;
  const riderPoint = live
    ? { latitude: data.location.latitude!, longitude: data.location.longitude! }
    : null;
  const status =
    data.order.customerStatus === "onway"
      ? de
        ? "Dein Fahrer ist auf dem Weg zu dir…"
        : "Your rider is on the way to you…"
      : t(`step.${step.key}.label`);
  const showDetails = expanded && Boolean(data.rider);
  return (
    <main className="tracking-screen">
      <div className="tracking-map-area" inert={showDetails}>
        {riderPoint || data.destination ? (
          <DeliveryTrackingMap
            key={data.order.id}
            destination={data.destination}
            rider={riderPoint}
            route={live ? data.route : null}
            recenter={recenter}
            label={de ? "Live-Lieferkarte" : "Live delivery map"}
            marker={
              <button
                className="rider-map-button"
                onClick={() => setExpanded(true)}
                aria-label={
                  de ? "Fahrerinformationen öffnen" : "Open rider information"
                }
                disabled={!data.rider}
              >
                <RiderAvatar
                  name={data.rider?.name || "Rider"}
                  src={data.rider?.avatarUrl}
                />
              </button>
            }
          />
        ) : (
          <div className="tracking-map-placeholder">
            <MapPin size={44} />
            <p>{t("tracking.awaitingLocation")}</p>
          </div>
        )}
        <Link
          href="/orders/"
          className="tracking-back"
          aria-label={t("tracking.viewOrders")}
        >
          <ChevronLeft size={26} />
        </Link>
        <p className="tracking-connection" role="status">
          {error
            ? de
              ? "Verbindung unterbrochen. Neuer Versuch…"
              : "Connection interrupted. Retrying…"
            : live
              ? de
                ? "Live-Standort"
                : "Live location"
              : data.location.updatedAt
                ? de
                  ? "Standort wird aktualisiert…"
                  : "Waiting for a fresh location…"
                : de
                  ? "Standort erscheint unterwegs zu dir"
                  : "Location appears on the way to you"}
        </p>
        <button
          className="tracking-recenter"
          onClick={() => setRecenter((value) => value + 1)}
          aria-label={de ? "Karte zentrieren" : "Recenter map"}
          disabled={!riderPoint && !data.destination}
        >
          <MapPin size={25} />
        </button>
      </div>
      <RiderSheet
        rider={data.rider}
        status={status}
        de={de}
        expanded={showDetails}
        onExpandedChange={setExpanded}
        actions={
          <TrackingActions
            data={data}
            accessToken={accessToken}
            refresh={refresh}
            de={de}
          />
        }
      >
        <TrackingJourney data={data} accessToken={accessToken} />
        <TrackingOrderDetails data={data} now={now} />
      </RiderSheet>
    </main>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="tracking-fallback">
          <PizzaLoader size="lg" showLabel label="Loading your delivery…" />
        </div>
      }
    >
      <TrackingScreen />
    </Suspense>
  );
}
