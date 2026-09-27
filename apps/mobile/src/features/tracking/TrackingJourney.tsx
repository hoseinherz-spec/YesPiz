"use client";
import { Car1, Bicycle, Motorcycle, Scooter, type IconComponent } from "@repo/icons";
import { JourneyStatus } from "./JourneyStatus";
import Link from "next/link";
import type { OrderTrackingView } from "@repo/api";
import { Notifications } from "@repo/api/components/notifications";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { pizzaCraftAsset } from "@/constants/media";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useApp } from "@/context/AppContext";

const stages = [
  "received",
  "kitchen",
  "preparing",
  "ready",
  "picked_up",
  "onway",
  "delivered",
];
const labels = {
  en: [
    "Finding your restaurant",
    "Restaurant confirmed",
    "Freshly preparing",
    "Ready for pickup",
    "Handed to your rider",
    "On the way to you",
    "Enjoy every bite",
  ],
  de: [
    "Wir suchen dein Restaurant",
    "Restaurant bestätigt",
    "Wird frisch zubereitet",
    "Bereit zur Abholung",
    "An deinen Fahrer übergeben",
    "Auf dem Weg zu dir",
    "Lass es dir schmecken",
  ],
};

const vehicleTypeLabels = (de: boolean): Record<string, string> => ({
  car: de ? "Auto" : "Car",
  motorcycle: de ? "Motorrad" : "Motorcycle",
  motorbike: de ? "Motorrad" : "Motorcycle",
  scooter: de ? "Roller" : "Scooter",
  bicycle: de ? "Fahrrad" : "Bicycle",
  bike: de ? "Fahrrad" : "Bicycle",
  "e-bike": "E-Bike",
  ebike: "E-Bike",
});

const vehicleIconMap: Record<string, IconComponent> = {
  car: Car1,
  motorcycle: Motorcycle,
  motorbike: Motorcycle,
  scooter: Scooter,
  bicycle: Bicycle,
  bike: Bicycle,
  "e-bike": Bicycle,
  ebike: Bicycle,
};
export function TrackingJourney({
  data,
  accessToken,
  hero = false,
}: {
  data: OrderTrackingView;
  accessToken: string;
  hero?: boolean;
}) {
  const { language } = useApp();
  const de = language === "de";
  const copy = labels[de ? "de" : "en"];
  const stage =
    data.order.fulfillmentStage || data.order.customerStatus || "received";
  const index = stage === "driver" ? 3 : Math.max(0, stages.indexOf(stage));
  const scheduled = data.order.isScheduled;
  const review = stage === "review";
  const matching = index === 0 && !scheduled && !review;
  const title = review
    ? de
      ? "Wir prüfen deine Bestellung"
      : "We’re checking on your order"
    : scheduled
      ? de
        ? "Für später vorgemerkt"
        : "Something good to look forward to"
      : copy[index];
  const description = review
    ? de
      ? "Unser Team kümmert sich darum. Kontaktiere uns, wenn du Hilfe brauchst."
      : "Our team is following up. We'll update you here; contact support if you need a hand."
    : scheduled
      ? de
        ? "Wir starten die Restaurantsuche rechtzeitig zu deiner Bestellung."
        : "We'll find your restaurant closer to your scheduled time."
      : matching
        ? de
          ? "Restaurants in deiner Nähe prüfen deine Anfrage. Sobald eines bestätigt, geht es los."
          : "Nearby restaurants are reviewing your request. Once one confirms, the kitchen gets to work."
        : index < 3
          ? de
            ? "Deine Bestellung wird mit Sorgfalt frisch zubereitet. Wir halten dich auf dem Laufenden."
            : "Your order is getting the care it deserves. We'll keep you posted, from oven to doorstep."
          : index === 3
            ? de
              ? "Alles ist bereit. Dein Fahrer holt deine Bestellung ab."
              : "Packed and ready. Your rider will collect your order next."
            : index === 6
              ? de
                ? "Deine Bestellung ist angekommen. Guten Appetit!"
                : "Your order has arrived. Time to gather around and dig in."
              : de
                ? "Verfolge deinen Fahrer auf der Karte. Halte deinen Übergabecode bereit."
                : "Follow your rider on the map. Keep your handoff code ready for their arrival.";
  const riderVehicleType = data.rider?.vehicleType ?? "";
  const VehicleIcon = vehicleIconMap[riderVehicleType] || Bicycle;
  const vehicleLabel = vehicleTypeLabels(de)[riderVehicleType] || "";
  return (
    <section
      className={`tracking-journey ${hero ? "tracking-journey--hero" : ""}`}
      aria-label={de ? "Bestellstatus" : "Order status"}
    >
      {hero && (
        <header className="journey-header">
          <Link
            href="/orders/"
            aria-label={de ? "Zurück zu Bestellungen" : "Back to orders"}
          >
            ←
          </Link>
          <span>{de ? "Deine Bestellung" : "Your order"}</span>
          <Link href={`/help/?order=${encodeURIComponent(data.order.id)}`}>
            {de ? "Hilfe" : "Help"}
          </Link>
        </header>
      )}
      {hero && (
        <div className="journey-art">
          {index >= 4 && index < 6 && data.rider?.vehicleType ? (
            <div className="journey-vehicle-badge">
              <VehicleIcon
                size={130}
                title={vehicleLabel}
              />
              {vehicleLabel && (
                <span className="vehicle-label">{vehicleLabel}</span>
              )}
            </div>
          ) : (
            <ProductImage
              src={pizzaCraftAsset(
                matching || scheduled
                  ? "Restaurant Service"
                  : index === 6
                    ? "Pizza Box"
                    : index < 4
                      ? "Pizza Oven"
                      : "Scooter",
              )}
              alt=""
              className="journey-illustration"
            />
          )}
        </div>
      )}
      {hero && (
        <div className="journey-heading" role="status" aria-atomic="true">
          <span className="journey-eyebrow">
            {de ? "VON DER KÜCHE ZU DIR" : "FROM KITCHEN TO YOUR DOOR"}
          </span>
          <h1>
            <JourneyStatus>{title!}</JourneyStatus>
          </h1>
          <p>{description}</p>
        </div>
      )}
      {matching && (
        <div className="journey-matching" aria-live="polite" aria-atomic="true">
          <div>
            <strong>
              <AnimatedNumber value={data.order.matching?.viewed ?? 0} />
            </strong>
            <span>
              {de
                ? data.order.matching?.viewed === 1
                  ? "Restaurant hat deine Anfrage gesehen"
                  : "Restaurants haben deine Anfrage gesehen"
                : data.order.matching?.viewed === 1
                  ? "restaurant has seen your request"
                  : "restaurants have seen your request"}
            </span>
          </div>
          <p>
            {data.order.matching?.notified
              ? de
                ? `An ${data.order.matching.notified} ${data.order.matching.notified === 1 ? "Restaurant" : "Restaurants"} gesendet`
                : `Sent to ${data.order.matching.notified} nearby ${data.order.matching.notified === 1 ? "restaurant" : "restaurants"}`
              : de
                ? "Wir suchen verfügbare Restaurants…"
                : "Looking for available restaurants…"}
          </p>
        </div>
      )}
      <details className="journey-notifications">
        <summary>
          {de
            ? "Über jeden Schritt informiert bleiben"
            : "A little heads-up at every step"}
        </summary>
        <p>
          {de
            ? "Aktiviere Push-Mitteilungen für Bestellupdates."
            : "Enable push notifications for updates, even when you leave the app."}
        </p>
        <Notifications accessToken={accessToken} />
      </details>
      {!scheduled && !review && (
        <details className="journey-progress-details" open={hero}>
          <summary>{de ? "Bestellfortschritt" : "Order progress"}</summary>
          <ol
            className="journey-timeline"
            aria-label={de ? "Lieferfortschritt" : "Delivery progress"}
          >
            {stages.map((key, i) => (
              <li
                key={key}
                data-complete={i < index}
                aria-current={i === index ? "step" : undefined}
              >
                <span className="journey-dot" aria-hidden="true">
                  {i < index ? "✓" : i + 1}
                </span>
                <span>
                  {copy[i]}
                  <small>
                    {i < index
                      ? de
                        ? "Abgeschlossen"
                        : "Complete"
                      : i === index
                        ? de
                          ? "Jetzt"
                          : "Now"
                        : de
                          ? "Als Nächstes"
                          : "Coming up"}
                  </small>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
