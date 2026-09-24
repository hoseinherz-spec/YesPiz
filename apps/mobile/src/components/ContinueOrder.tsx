"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";


import Link from "next/link";
import { ArrowRight, ShoppingBag } from "@/components/animated-icon/icons";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";

export function ContinueOrder() {
  const { count, subtotal, items } = useCart();
  const { language, hydrated } = useApp();
  if (!hydrated || !count) return null;
  return (
    <section className="continue-order">
      <AppText as="h2">
        {language === "de" ? "Bestellung fortsetzen" : "Continue your order"}
      </AppText>
      <Link href="/cart/">
        <span className="continue-order-icon">
          <ShoppingBag size={28} />
        </span>
        <span className="continue-order-description">
          <AppText as="strong">{items[0]?.name}</AppText>
          <AppText as="small">
            <AnimatedNumber value={count} />{" "}
            {language === "de" ? "Artikel im Warenkorb" : "items in your cart"}
          </AppText>
        </span>
        <AppText as="span"><AnimatedNumber currency value={subtotal} /></AppText>
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
