"use client";

import Link from "next/link";
import { Skeleton } from "@heroui/react";
import { PageHero } from "@repo/ui/mobile-page-transition";
import { ShoppingBag } from "@/components/animated-icon/icons";
import { resolveProductImage } from "@/constants/pizzas";
import type { CatalogPizza } from "@/lib/catalog";
import { ProductImage } from "./ProductImage/ProductImage";
import styles from "./PizzaBrowse.module.css";
import { ComboCard } from "./ComboCard";

export function MenuPizzaCard({
  pizza,
  language,
}: {
  pizza: CatalogPizza;
  language: string;
}) {
  if (pizza.comboComponents?.length) return <ComboCard pizza={pizza} language={language} />;
  const money = (value: number) =>
    new Intl.NumberFormat(language === "de" ? "de-AT" : "en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  return (
    <Link
      href={`/menu/${encodeURIComponent(pizza.id)}/`}
      className={styles.card}
      aria-label={`${pizza.name}, ${money(pizza.price)}`}
    >
      <svg
        className={styles.cardShape}
        viewBox="0 0 200 300"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M36 0H164Q200 0 200 36V220Q200 248 172 248H155Q127 248 127 274Q127 300 101 300H36Q0 300 0 264V36Q0 0 36 0Z" />
      </svg>
      <PageHero id={pizza.id}>
        <div className={styles.image}>
          <ProductImage
            src={resolveProductImage(pizza)}
            alt=""
            className={styles.pizzaImage}
            fallbackClassName={styles.imageFallback}
          />
        </div>
      </PageHero>
      <div className={styles.copy}>
        <h2>{pizza.name}</h2>
        <p className="line-clamp-2">{pizza.tagline}</p>
        <strong>{money(pizza.price)}</strong>
      </div>
      <span className={styles.bag} aria-hidden="true">
        <ShoppingBag size={19} />
      </span>
    </Link>
  );
}

export function MenuPizzaCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <svg
        className={styles.cardShape}
        viewBox="0 0 200 300"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M36 0H164Q200 0 200 36V220Q200 248 172 248H155Q127 248 127 274Q127 300 101 300H36Q0 300 0 264V36Q0 0 36 0Z" />
      </svg>
      <div className={styles.image}>
        <Skeleton className="size-full rounded-full" />
      </div>
      <div className={styles.copy}>
        <h2><Skeleton render={(props) => <span {...props} />} className="block h-[1.2em] w-4/5 rounded-lg" /></h2>
        <p><Skeleton render={(props) => <span {...props} />} className="block h-[1em] w-full rounded" /><Skeleton render={(props) => <span {...props} />} className="mt-[.5em] block h-[1em] w-3/4 rounded" /></p>
        <strong><Skeleton render={(props) => <span {...props} />} className="block h-[1.2em] w-16 rounded-lg" /></strong>
      </div>
      <Skeleton className={styles.bag} />
    </div>
  );
}
