"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ShoppingBag,
  Clock,
  Star,
} from "@/components/animated-icon/icons";
import type { OrderTrackingView } from "@repo/api";
import { RiderAvatar } from "./RiderAvatar";

type Props = {
  rider: OrderTrackingView["rider"];
  status: string;
  de: boolean;
  children: ReactNode;
  actions: ReactNode;
  expanded: boolean;
  onExpandedChange: (value: boolean) => void;
};
export function RiderSheet({
  rider,
  status,
  de,
  children,
  actions,
  expanded,
  onExpandedChange,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [joinedAtNow] = useState(Date.now);
  const restoreTriggerFocus = useCallback(() => trigger.current?.focus(), []);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const key = (event: KeyboardEvent) => {
      // A nested cancellation drawer manages its own focus and Escape key.
      if (!panel.current?.contains(document.activeElement)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onExpandedChange(false);
      }
      if (event.key === "Tab") {
        const items = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input, textarea, [tabindex="0"]',
          ) ?? [],
        ).filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (
        previous?.isConnected &&
        previous !== document.body &&
        previous !== document.documentElement
      )
        previous.focus();
      else requestAnimationFrame(restoreTriggerFocus);
    };
  }, [expanded, onExpandedChange, restoreTriggerFocus]);
  const years = rider?.memberSince
    ? Math.max(
        0,
        Math.floor(
          (joinedAtNow - Date.parse(rider.memberSince)) / (365.25 * 86400000),
        ),
      )
    : null;
  return (
    <section
      ref={panel}
      className="rider-sheet"
      data-expanded={expanded}
      role={expanded ? "dialog" : "region"}
      aria-modal={expanded || undefined}
      aria-label={
        expanded ? (de ? "Fahrerinformationen" : "Driver Information") : status
      }
    >
      <div className="rider-sheet-scroll">
        {expanded ? (
          <>
            <header className="rider-detail-header">
              <button
                ref={close}
                onClick={() => onExpandedChange(false)}
                aria-label={de ? "Zurück zur Karte" : "Back to map"}
              >
                <ChevronLeft size={25} />
              </button>
              <h1>{de ? "Fahrerinformationen" : "Driver Information"}</h1>
            </header>
            {rider && (
              <>
                <div className="rider-portrait">
                  <RiderAvatar name={rider.name} src={rider.avatarUrl} />
                  <h2>{rider.name}</h2>
                  <p>
                    {de
                      ? "Kontakt über geschützte Verbindung"
                      : "Contact through a protected connection"}
                  </p>
                </div>
                <div className="rider-stats">
                  <div>
                    <Star size={25} />
                    <strong
                      aria-label={
                        de ? "Noch keine Bewertung" : "Rating unavailable"
                      }
                    >
                      —
                    </strong>
                    <span>{de ? "Bewertungen" : "Ratings"}</span>
                  </div>
                  <div>
                    <ShoppingBag size={25} />
                    <strong>{rider.completedOrders}</strong>
                    <span>{de ? "Bestellungen" : "Orders"}</span>
                  </div>
                  <div>
                    <Clock size={25} />
                    <strong>{years ?? "—"}</strong>
                    <span>{de ? "Jahre" : "Years"}</span>
                  </div>
                </div>
                <dl className="rider-info">
                  <div>
                    <dt>{de ? "Mitglied seit" : "Member Since"}</dt>
                    <dd>
                      {rider.memberSince
                        ? new Date(rider.memberSince).toLocaleDateString(
                            de ? "de-DE" : "en-GB",
                            { day: "numeric", month: "long", year: "numeric" },
                          )
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>{de ? "Fahrzeug" : "Vehicle Model"}</dt>
                    <dd>{rider.vehicleModel || "—"}</dd>
                  </div>
                  <div>
                    <dt>{de ? "Kennzeichen" : "Plate Number"}</dt>
                    <dd>{rider.plateNumber || "—"}</dd>
                  </div>
                </dl>
              </>
            )}
            <div className="tracking-order-details">{children}</div>
          </>
        ) : (
          <>
            <h1
              className="tracking-status"
              aria-live="polite"
              aria-atomic="true"
            >
              {status}
            </h1>
            <div className="tracking-order-details">{children}</div>
            {rider ? (
              <button
                ref={trigger}
                className="rider-summary"
                onClick={() => onExpandedChange(true)}
                aria-expanded={false}
                aria-label={`${de ? "Fahrerinformationen" : "Driver information"}: ${rider.name}`}
              >
                <RiderAvatar name={rider.name} src={rider.avatarUrl} />
                <span>
                  <strong>{rider.name}</strong>
                  <small>
                    {rider.vehicleModel ||
                      (de ? "Dein Fahrer" : "Your delivery rider")}
                  </small>
                </span>
                <span className="rider-plate">
                  {rider.plateNumber}
                  <ChevronLeft size={18} className="rider-expand-icon" />
                </span>
              </button>
            ) : (
              <div className="rider-pending">
                <RiderAvatar name="" />
                <p>
                  {de
                    ? "Dein Fahrer wird hier angezeigt, sobald er zugewiesen wurde."
                    : "Your rider will appear here once assigned."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="tracking-actions">{actions}</div>
    </section>
  );
}
