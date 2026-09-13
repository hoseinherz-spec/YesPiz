"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { PageBanner } from "@/components/PageBanner";
import { AppText } from "@/components/Text";


import { Button, Typography } from "@heroui/react";
import {
  Bookmark,
  MapPin,
  MenuCenter,
  Search,
  ShoppingBag,
  User,
} from "@repo/icons";
import Link from "next/link";
import { useMemo, useState } from "react";

import { HomeOrderCard } from "@/components/HomeOrderCard";
import { AppFrame } from "@/components/AppFrame";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
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
  const { t } = useApp();
  const { count } = useCart();
  const { items, fromApi, isOffline, isLoading } = useMenuCatalog();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");

  const list = useMemo(
    () => filterByCategory(items, cat, fromApi),
    [items, cat, fromApi],
  );
  const featured = list[0] ?? items[0] ?? null;

  return (
    <AppFrame withTabs className="reference-screen home-screen">
      <header className="browse-hero">
      <div className="flex items-center justify-between gap-3">
        <IconBadgeButton href="/menu/" aria-label="Browse menu">
          <MenuCenter size={20} />
        </IconBadgeButton>
        <div className="flex items-center gap-2">
          <IconBadgeButton href="/saved/" aria-label="Saved pizzas">
            <Bookmark size={19} />
          </IconBadgeButton>
          <IconBadgeButton href="/profile/" aria-label="Profile">
            <User size={19} />
          </IconBadgeButton>
          <IconBadgeButton href="/cart/" aria-label="Cart" badge={count}>
            <ShoppingBag size={19} />
          </IconBadgeButton>
        </div>
      </div>

      <div className="mt-8">
        <AppText as="span" className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          <MapPin size={14} color="currentColor" />
          {t("home.deliverTo")}
        </AppText>
        <Typography
          type="h1"
          className={cn(
            hx.display,
            "max-w-[360px] text-[clamp(36px,11vw,50px)]",
          )}
        >
          Order Your
          <br />
          Favorite Pizza
        </Typography>
      </div>

      </header>

      {isOffline ? (
        <div className="mt-4 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, "text-warning")}>
            {t("login.offlineBanner")}
          </Typography>
        </div>
      ) : null}

      <PageBanner />
      <HomeOrderCard />

      <Link
        href="/menu/"
        className="mt-6 flex min-h-16 items-center gap-3 rounded-full bg-field-background px-2.5 py-2"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-tertiary">
          <Search size={19} color="var(--foreground)" />
        </span>
        <AppText as="span" className="flex-1 text-[14px] font-medium text-muted">
          {t("home.search")}
        </AppText>
        <AppText as="span" className="pr-3 text-[12px] font-semibold text-foreground">
          Browse
        </AppText>
      </Link>

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
              <ProductImage src={`/images/pizza-${({All: "yespiz-special", Popular: "pepperoni", Classic: "margherita", Spicy: "diavola", Veggie: "vegetariana", Premium: "quattro-formaggi"})[c]}.png`} alt="" className="category-picture" />
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
            {cat === "All" ? "Featured pizza" : cat}
          </div>
          <div className="grid h-[clamp(245px,72vw,330px)] place-items-center px-8 pb-5 pt-14">
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
                {featured.tagline || "Choose your size and toppings"}
              </Typography>
            </div>
            <AppText as="span" className="shrink-0 rounded-full bg-accent px-4 py-2 text-[14px] font-extrabold text-accent-foreground">
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
            No pizzas available
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {list.slice(1, 5).map((pizza) => (
              <ProductCard key={pizza.id} pizza={pizza} variant="grid" />
            ))}
          </div>
        </section>
      ) : null}
    </AppFrame>
  );
}
