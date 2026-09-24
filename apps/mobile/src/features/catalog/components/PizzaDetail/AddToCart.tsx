"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check } from "@/components/animated-icon/icons";
import { SlidingNumber } from "@/components/SlidingNumber";
import { Button } from "@heroui/react";
import { Plus, ShoppingBasket } from "lucide-react";
import action from "./BuyAction.module.css";
import "./buy-motion.css";
import "@/components/TabBar/TabBar.css";
import { useCart, type CartItem } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import styles from "./PizzaDetail.module.css";
import { AdaptiveStepper } from "@/components/motion/AdaptiveStepper";

type Flight = {
  src: string;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  angle: number;
};

export function AddToCart({
  item,
  valid,
  hero,
  onAnimating,
}: {
  item: Omit<CartItem, "lineId" | "quantity">;
  valid: boolean;
  hero: RefObject<HTMLDivElement | null>;
  onAnimating: (value: boolean) => void;
}) {
  const { addItem } = useCart();
  const { language } = useApp();
  const router = useRouter();
  const de = language === "de";
  const [quantity, setQuantity] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const flying = useRef<HTMLDivElement>(null);
  const locked = useRef(false);

  useEffect(() => {
    if (!flight || !flying.current) return;
    const animation = flying.current.animate(
      [
        {
          transform: `translate(0, 0) scale(1) rotate(${flight.angle}deg)`,
          opacity: 1,
        },
        {
          transform: `translate(${flight.dx * 0.25}px, ${Math.min(0, flight.dy) - 45}px) scale(.5) rotate(-35deg)`,
          opacity: 1,
          offset: 0.4,
        },
        {
          transform: `translate(${flight.dx}px, ${flight.dy}px) scale(.08) rotate(-100deg)`,
          opacity: 1,
          offset: 0.82,
        },
        {
          transform: `translate(${flight.dx}px, ${flight.dy}px) scale(0) rotate(-110deg)`,
          opacity: 0,
        },
      ],
      { duration: 1500, easing: "cubic-bezier(.45,0,.2,1)", fill: "forwards" },
    );
    let cancelled = false;
    void animation.finished
      .then(async () => {
        const pulse = button.current?.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(.9)", offset: 0.4 },
            { transform: "scale(1)" },
          ],
          { duration: 260, easing: "ease-out" },
        );
        if (pulse) await pulse.finished.catch(() => undefined);
        if (!cancelled) router.push("/menu/");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [flight, router]);

  function add() {
    if (!valid || locked.current) return;
    locked.current = true;
    setBusy(true);
    addItem({ ...item, quantity });
    const source = hero.current?.querySelector("img");
    const from = source?.getBoundingClientRect();
    const to = button.current?.getBoundingClientRect();
    if (
      !from ||
      !to ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      router.push("/menu/");
      return;
    }
    const computed = getComputedStyle(source!);
    const left = parseFloat(computed.paddingLeft) || 0;
    const right = parseFloat(computed.paddingRight) || 0;
    const top = parseFloat(computed.paddingTop) || 0;
    const bottom = parseFloat(computed.paddingBottom) || 0;
    const size = Math.min(
      source!.clientWidth - left - right,
      source!.clientHeight - top - bottom,
    );
    const angle =
      parseFloat(getComputedStyle(source!.parentElement!).rotate) || 0;
    const x = from.left + (from.width - size + left - right) / 2;
    const y = from.top + (from.height - size + top - bottom) / 2;
    setFlight({
      src: source!.currentSrc || item.image,
      x,
      y,
      size,
      angle,
      dx: to.left + to.width / 2 - x - size / 2,
      dy: to.top + to.height / 2 - y - size / 2,
    });
    onAnimating(true);
  }

  return (
    <>
      <div className={action.dock}>
        <div
          className={`${action.backdrop} bottom-nav-backdrop`}
          aria-hidden="true"
        >
          {[1, 2, 3, 4, 5, 6].map((layer) => (
            <span
              key={layer}
              className={`bottom-nav-blur bottom-nav-blur-${layer}`}
            />
          ))}
        </div>
        <div className={`${action.pill} t-resize`} data-expanded={expanded}>
          <Button
            ref={trigger}
            variant="primary"
            className={action.compact}
            aria-expanded={expanded}
            aria-controls="pizza-buy-controls"
            isDisabled={!valid || busy}
            inert={expanded}
            aria-hidden={expanded}
            onPress={() => setExpanded(true)}
          >
            <Plus size={24} />
            <span>{de ? "Hinzufügen" : "Add"}</span>
            <SlidingNumber
              value={item.unitPrice}
              locale={de ? "de-DE" : "en-IE"}
              format={{
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </Button>
          <div
            id="pizza-buy-controls"
            className={action.expanded}
            inert={!expanded}
            aria-hidden={!expanded}
          >
            <div className={action.total}>
              <span>{de ? "Gesamtbetrag" : "Total Amount"}</span>
              <SlidingNumber
                value={item.unitPrice * quantity}
                locale={de ? "de-DE" : "en-IE"}
                format={{
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
            </div>
            <AdaptiveStepper value={quantity} onValueChange={setQuantity} min={1} max={99} disabled={busy} className={action.adaptive} aria-label={de ? "Anzahl" : "Quantity"} />
            <Button
              ref={button}
              variant="primary"
              onPress={add}
              isDisabled={!valid || busy}
              className={action.buy}
              aria-busy={busy}
            >
              {busy ? <Check size={24} /> : <ShoppingBasket size={24} />}
              <span>
                {busy ? (de ? "Fertig" : "Added") : de ? "Hinzufügen" : "Add to cart"}
              </span>
            </Button>
          </div>
        </div>
        <span className="sr-only" role="status">
          {busy
            ? de
              ? "Zum Warenkorb hinzugefügt"
              : "Added to your cart"
            : ""}
        </span>
      </div>
      {flight &&
        createPortal(
          <div
            ref={flying}
            aria-hidden="true"
            className={styles.flyingPizza}
            style={{
              left: flight.x,
              top: flight.y,
              width: flight.size,
              height: flight.size,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flight.src} alt="" />
          </div>,
          document.body,
        )}
    </>
  );
}
