"use client";
import { useEffect, useMemo, useState } from "react";
import { useWaitingPreference } from "@/lib/waiting-preference";
import Link from "next/link";
import { Sparkles, RotateCcw, ChevronDown } from "lucide-react";
import { useMenuCatalog, type CatalogPizza } from "@/lib/catalog";
import { useApp } from "@/context/AppContext";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";

/** A small optional game: no invented points, no influence on delivery progress. */
export function WaitingLounge({ orderId }: { orderId: string }) {
  const { enabled } = useWaitingPreference();
  const { items, fromApi } = useMenuCatalog();
  const picks = useMemo(() => fromApi
    ? items.filter((item) => item.image && !item.comboComponents?.length).slice(0, 3)
    : [], [items, fromApi]);
  if (!enabled || picks.length !== 3) return null;
  return <PizzaPairs key={orderId} orderId={orderId} initialPicks={picks} />;
}

function PizzaPairs({ orderId, initialPicks }: { orderId: string; initialPicks: CatalogPizza[] }) {
  const { language } = useApp();
  const de = language === "de";
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [cards] = useState(() => {
    // Stable deck per order; live catalog refreshes must not rearrange a game.
    return [0, 1, 2, 1, 0, 2]
      .map((index) => initialPicks[(index + orderId.length) % 3])
      .filter((item) => !!item);
  });
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const timer = setTimeout(() => {
      if (cards[a!]?.id === cards[b!]?.id)
        setMatched((previous) => [...new Set([...previous, cards[a!]!.id])]);
      setFlipped([]);
    }, 750);
    return () => clearTimeout(timer);
  }, [flipped, cards]);
  const done = matched.length === 3;
  return (
    <section className="waiting-lounge t-acc" data-open={open}>
      <button
        type="button"
        className="t-acc-head waiting-lounge-head"
        aria-expanded={open}
        aria-controls="pizza-pairs"
        onClick={() => setOpen(!open)}
      >
        <Sparkles size={24} />
        <span>
          <strong>
            {de ? "Eine kleine Pizzapause" : "A little play while you wait"}
          </strong>
          <small>
            {de
              ? "Finde die Paare · freiwilliges Mini-Spiel"
              : "Find the pairs · an optional mini game"}
          </small>
        </span>
        <span className="t-acc-chevron">
          <ChevronDown size={20} />
        </span>
      </button>
      <div className="t-acc-panel" id="pizza-pairs" inert={!open}>
        <div className="t-acc-panel-inner">
          <div className="waiting-game">
            <p>
              {de
                ? "Deine Bestellung läuft weiter. Finde die drei Paare."
                : "Your order keeps moving. Match three pairs from our menu."}
            </p>
            <div className="waiting-cards">
              {cards.map((card, index) => {
                const revealed =
                  flipped.includes(index) || matched.includes(card.id);
                return (
                  <button
                    type="button"
                    key={`${card.id}-${index}`}
                    data-revealed={revealed}
                    disabled={
                      matched.includes(card.id) ||
                      flipped.includes(index) ||
                      flipped.length === 2 ||
                      done
                    }
                    aria-label={
                      revealed
                        ? card.name
                        : `${de ? "Karte" : "Card"} ${index + 1}`
                    }
                    aria-pressed={revealed}
                    onClick={() => {
                      if (!flipped.length) setMoves((count) => count + 1);
                      setFlipped((previous) => [...previous, index]);
                    }}
                  >
                    {revealed ? (
                      <>
                        <ProductImage src={card.image} alt="" />
                        <span>{card.name}</span>
                      </>
                    ) : (
                      <span className="waiting-card-back">✦</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p role="status">
              {done
                ? de
                  ? `Alle Paare gefunden in ${moves} Zügen!`
                  : `All pairs found in ${moves} turns!`
                : `${matched.length}/3 ${de ? "Paare" : "pairs"}`}
            </p>
            <div className="waiting-game-footer">
              <button
                type="button"
                onClick={() => {
                  setFlipped([]);
                  setMatched([]);
                  setMoves(0);
                }}
              >
                <RotateCcw size={15} />
                {de ? "Neustart" : "Play again"}
              </button>
              <Link href="/rewards/">
                {de ? "Meine Prämien" : "My rewards"} ↗
              </Link>
            </div>
            <small>
              {de
                ? "Nur zum Spaß. Prämien erhältst du für qualifizierte Bestellungen."
                : "Just for fun. Loyalty rewards come from qualifying orders."}
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
