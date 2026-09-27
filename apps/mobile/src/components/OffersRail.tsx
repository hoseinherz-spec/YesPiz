"use client";
import { useEffect, useState } from "react";
import { apiRequest, withAuth } from "@repo/api";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { Ticket, ArrowUpRight, Copy, Check } from "lucide-react";

type Offer = {
  code: string;
  name: string;
  kind: "fixed" | "percent";
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number;
  endAt: string;
  productScope: string;
  minimumEligibleQuantity: number;
  eligibleProducts?: { id: string; name: string }[];
};
export function OffersRail({ compact = false, title, showRewardsLink = true }: { compact?: boolean; title?: string; showRewardsLink?: boolean }) {
  const { accessToken, language } = useApp();
  const [result, setResult] = useState<{
    token: string;
    offers: Offer[];
  } | null>(null);
  const [now, setNow] = useState(Date.now);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const de = language === "de";
  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    void apiRequest<Offer[]>(
      "/api/v1/offers",
      withAuth({ accessToken, signal: controller.signal }),
    )
      .then((offers) => {
        setResult({ token: accessToken, offers });
        setError("");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            de
              ? "Angebote nicht verfügbar."
              : "Offers are unavailable right now.",
          );
      });
    return () => controller.abort();
  }, [accessToken, retry, de]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const offers =
    result?.token === accessToken
      ? result.offers.filter((offer) => Date.parse(offer.endAt) > now)
      : [];
  if (!accessToken)
    return (
      <Link className="offers-invite" href="/auth/sign-in/?next=/rewards/">
        <Ticket size={24} />
        <span>
          <strong>
            {de
              ? "Deine nächste Pizza hat Extras."
              : "Your next pizza comes with perks."}
          </strong>
          <small>
            {de
              ? "Anmelden und Angebote entdecken"
              : "Sign in to discover offers & rewards"}
          </small>
        </span>
        <ArrowUpRight size={22} />
      </Link>
    );
  if (error)
    return (
      <div className="offers-notice" role="status">
        {error}{" "}
        <button onClick={() => setRetry((value) => value + 1)}>
          {de ? "Erneut versuchen" : "Retry"}
        </button>
      </div>
    );
  if (!offers.length) return null;
  return (
    <section
      className="offers-section"
      aria-label={de ? "Deine Angebote" : "Your offers"}
    >
      <div className="offers-heading">
        <h2>{title ?? (de ? "Ein Extra für dich" : "A little extra, for you")}</h2>
        {!compact && showRewardsLink && (
          <Link href="/rewards/">{de ? "Prämien" : "Rewards"} ↗</Link>
        )}
      </div>
      <div className="offers-rail">
        {offers.slice(0, compact ? 2 : 6).map((offer) => (
          <article className="offer-ticket" key={offer.code}>
            <div className="offer-ticket-top">
              <Ticket size={23} />
              <span>{de ? "DEIN ANGEBOT" : "JUST FOR YOU"}</span>
            </div>
            <strong className="offer-value">
              {offer.kind === "percent"
                ? `${offer.value}%`
                : `€${(offer.value / 100).toFixed(2)}`}{" "}
              <small>{de ? "Rabatt" : "off"}</small>
            </strong>
            <h3>{offer.name}</h3>
            <p>
              {de ? "Ab" : "On orders from"} €
              {(offer.minSubtotalCents / 100).toFixed(2)}
              {offer.kind === "percent"
                ? ` · ${de ? "max." : "up to"} €${(offer.maxDiscountCents / 100).toFixed(2)}`
                : ""}
            </p>
            {offer.productScope === "specific" && (
              <p>
                {de ? "Für ausgewählte Produkte" : "Selected products only"} ·{" "}
                {de ? "mind." : "minimum"} {offer.minimumEligibleQuantity}
                {Boolean(offer.eligibleProducts?.length) && (
                  <span className="block mt-1">
                    {offer.eligibleProducts!.map((product, index) => (
                      <span key={product.id}>
                        {index > 0 && ", "}
                        <Link
                          className="underline underline-offset-2"
                          href={`/pizza/?id=${encodeURIComponent(product.id)}`}
                        >
                          {product.name}
                        </Link>
                      </span>
                    ))}
                  </span>
                )}
              </p>
            )}
            <p>
              {de ? "Gültig bis" : "Valid until"}{" "}
              {new Date(offer.endAt).toLocaleDateString(de ? "de-DE" : "en-GB")}
            </p>
            <button
              type="button"
              className="offer-code"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(offer.code);
                  setCopied(offer.code);
                } catch {
                  setCopied(`manual:${offer.code}`);
                }
              }}
            >
              <span>{offer.code}</span>
              {copied === offer.code ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <small role="status">
              {copied === offer.code
                ? de
                  ? "Kopiert! Beim Bezahlen einlösen."
                  : "Copied! Apply at checkout."
                : copied === `manual:${offer.code}`
                  ? de
                    ? "Code beim Bezahlen eingeben."
                    : "Enter this code at checkout."
                  : de
                    ? "Ein Code pro Bestellung"
                    : "One code per order"}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
