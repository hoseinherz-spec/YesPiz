"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { ReferenceHeader } from "@/components/ReferenceHeader";
import { UsualPizzas } from "@/components/UsualPizzas";
import { AppText } from "@/components/Text";

import { Button, Typography } from "@heroui/react";
import {
  Bookmark,
  MapPin,
  Search,
  Heart,
  Pizza,
  Leaf,
  Crown1,
  MenuGrid,
  Fire1,
} from "@repo/icons";
import Link from "next/link";
import { useMemo, useState } from "react";

import { HomeOrderCard } from "@/components/HomeOrderCard";
import { AppFrame } from "@/components/AppFrame";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { useApp } from "@/context/AppContext";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { useMenuCatalog, type CatalogPizza } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

const CATEGORIES = [
  "All",
  "Popular",
  "Classic",
  "Spicy",
  "Veggie",
  "Premium",
] as const;

const STATIC_CATEGORY_MAP: Record<
  (typeof CATEGORIES)[number],
  string[] | null
> = {
  All: null,
  Popular: ["pepperoni", "yespiz-special", "diavola", "bbq-chicken"],
  Classic: ["margherita", "salami", "funghi"],
  Spicy: ["diavola", "pepperoni"],
  Veggie: ["vegetariana", "funghi", "quattro-formaggi"],
  Premium: ["yespiz-special", "quattro-formaggi", "bbq-chicken"],
};

function filterByCategory(
  items: CatalogPizza[],
  cat: (typeof CATEGORIES)[number],
  fromApi: boolean,
): CatalogPizza[] {
  if (cat === "All") return items;
  if (!fromApi) {
    const ids = STATIC_CATEGORY_MAP[cat];
    if (!ids) return items;
    return items.filter((p) => ids.includes(p.id));
  }
  switch (cat) {
    case "Spicy":
      return items.filter((p) =>
        p.tags.some((tag) => tag.toLowerCase().includes("spicy")),
      );
    case "Veggie":
      return items.filter((p) =>
        p.tags.some((tag) => {
          const n = tag.toLowerCase();
          return n.includes("veg") || n.includes("vegetarian");
        }),
      );
    case "Premium":
      return [...items]
        .sort((a, b) => b.price - a.price)
        .slice(0, Math.max(3, items.length));
    case "Popular":
      return items.slice(0, Math.min(4, items.length));
    case "Classic":
      return items.filter(
        (p) => !p.tags.some((tag) => tag.toLowerCase().includes("spicy")),
      );
    default:
      return items;
  }
}

export default function HomePage() {
  const { t, language, addresses, selectedAddressId } = useApp();
  const address = addresses.find((entry) => entry.id === selectedAddressId);
  const { items, fromApi, isOffline, isLoading } = useMenuCatalog();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");

  const list = useMemo(
    () => filterByCategory(items, cat, fromApi),
    [items, cat, fromApi],
  );
  const featured = list[0] ?? null;

  return (
    <AppFrame withTabs className="reference-screen home-screen">
      <ReferenceHeader />
      <header className="browse-hero">
        <div className="flex items-center justify-between gap-3">
          <Link href="/addresses/" className="home-delivery min-w-0 flex-1">
            <MapPin size={18} />
            <span className="min-w-0">
              <small>{t("home.deliveryLabel")}</small>
              <strong>{address?.detail || t("home.addAddress")}</strong>
            </span>
          </Link>
          <IconBadgeButton href="/saved/" aria-label={t("home.savedLabel")}>
            <Bookmark size={19} />
          </IconBadgeButton>
        </div>
        <Typography type="h1" className="mt-5 font-extrabold">
          {t("home.orderHeading")}
        </Typography>
      </header>
      <Link href="/menu/" className="home-search mt-4">
        <Search size={20} />
        <span>{t("home.search")}</span>
      </Link>
      <nav className="mt-4 flex gap-2" aria-label="More ways to enjoy pizza">
        <Link
          href="/group/"
          className="data-surface flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-xs font-semibold"
        >
          {language === "de" ? "Zusammen bestellen" : "Pizza together"}
        </Link>
        <Link
          href="/rewards/"
          className="data-surface flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-xs font-semibold"
        >
          {language === "de" ? "Prämien & Plus" : "Rewards & Plus"}
        </Link>
        <Link
          href="/bundles/"
          className="data-surface flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-xs font-semibold"
        >
          {language === "de" ? "Pizza-Pakete" : "Pizza packs"}
        </Link>
      </nav>
      <UsualPizzas />
      <HomeOrderCard />
      {isOffline ? (
        <div className="mt-4 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, "text-warning")}>
            {t("login.offlineBanner")}
          </Typography>
        </div>
      ) : null}

      <div className="category-illustrations" aria-label="Pizza categories">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            data-id={c}
            aria-pressed={cat === c}
            variant={cat === c ? "primary" : "secondary"}
            className="category-illustration"
            onPress={() => setCat(c)}
          >
            {(() => {
              const Icon = {
                All: MenuGrid,
                Popular: Heart,
                Classic: Pizza,
                Spicy: Fire1,
                Veggie: Leaf,
                Premium: Crown1,
              }[c];
              return <Icon size={24} />;
            })()}
            <AppText as="span">{t(`category.${c}`)}</AppText>
          </Button>
        ))}
      </div>

      {featured ? (
        <Link
          href={`/pizza/?id=${encodeURIComponent(featured.id)}`}
          className="product-showcase relative mt-6 block overflow-hidden rounded-[36px] transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-focus"
        >
          <div className="absolute top-5 left-5 z-10 rounded-full bg-accent px-4 py-2 text-[12px] font-bold text-accent-foreground">
            {cat === "All" ? t("home.featuredLabel") : t(`category.${cat}`)}
          </div>
          <div className="home-featured-image grid h-[200px] place-items-center px-8 pb-2 pt-12">
            <ProductImage
              src={featured.imageUrl || featured.image}
              alt={featured.name}
              className="product-showcase-image aspect-square h-full max-w-full rounded-full object-contain"
            />
          </div>
          <div className="product-showcase-caption flex items-end justify-between gap-3 px-5 py-5">
            <div className="min-w-0">
              <Typography
                type="h2"
                className={cn(hx.h2, "text-[24px] text-balance")}
              >
                {featured.name}
              </Typography>
              <Typography type="body-sm" className={cn(hx.bodySm, "mt-1")}>
                {t("home.choosePizza")}
              </Typography>
            </div>
            <AppText
              as="span"
              className="shrink-0 rounded-full bg-accent px-4 py-2 text-[14px] font-extrabold text-accent-foreground"
            >
              <AnimatedNumber currency value={featured.price} />
            </AppText>
          </div>
        </Link>
      ) : isLoading ? (
        <div
          className="mt-6 h-[390px] animate-pulse rounded-[44px] bg-card"
          aria-label="Loading pizzas"
        />
      ) : (
        <div className="mt-6 rounded-[30px] border border-border p-6 text-center">
          <Typography type="h3" className={hx.h3}>
            {t("home.noCategoryResults")}
          </Typography>
          <Link
            href="/menu/"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-[14px] font-bold text-accent-foreground"
          >
            Try the menu
          </Link>
        </div>
      )}

      {list.length > 1 ? (
        <section className="mt-8 pb-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Typography type="h3" className={hx.h3}>
              Popular pizzas
            </Typography>
            <Link
              href="/menu/"
              className="text-[13px] font-semibold text-muted"
            >
              See all
            </Link>
          </div>
          <div className="home-pizza-rail">
            {list.slice(1, 5).map((pizza) => (
              <ProductCard key={pizza.id} pizza={pizza} variant="grid" />
            ))}
          </div>
        </section>
      ) : null}
    </AppFrame>
  );
}
