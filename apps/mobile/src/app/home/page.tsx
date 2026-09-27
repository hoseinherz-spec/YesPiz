"use client";
import { OffersRail } from "@/components/OffersRail";
import { HomeBanners } from "@/components/HomeBanners";
import { HomeHeader } from "@/components/HomeHeader";
import { FlowReveal } from "@/components/motion/FlowReveal";

import { FoodCategorySection } from "@/components/FoodCategorySection";
import { UsualPizzas } from "@/components/UsualPizzas";

import { Typography } from "@heroui/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { HomeOrderCard, LastOrderRail } from "@/components/HomeOrderCard";
import { AppFrame } from "@/components/AppFrame";
import { useApp } from "@/context/AppContext";
import { MenuPizzaCard, MenuPizzaCardSkeleton } from "@/features/catalog/components/MenuPizzaCard";
import { ComboMenuCard } from "@/features/catalog/components/ComboMenuCard";
import pizzaStyles from "@/features/catalog/components/PizzaBrowse.module.css";
import { useMenuCatalog, type CatalogPizza } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";
import { Users, Gift, ArrowUpRight } from "lucide-react";

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
        .filter(p => p.tags.some(tag => tag.toLowerCase() === "premium"));
    case "Popular":
      return items.filter(p => p.tags.some(tag => ["popular", "bestseller"].includes(tag.toLowerCase())));
    case "Classic":
      return items.filter(
        (p) => !p.tags.some((tag) => tag.toLowerCase().includes("spicy")),
      );
    default:
      return items;
  }
}

export default function HomePage() {
  const { t, language } = useApp();
  const [search, setSearch] = useState("");
  const { items, fromApi, isOffline, isLoading } = useMenuCatalog();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");

  const combos = useMemo(
    () => items.filter((item) => item.comboComponents?.length),
    [items],
  );
  const pizzas = useMemo(
    () => items.filter((item) => !item.comboComponents?.length),
    [items],
  );

  const list = useMemo(
    () =>
      filterByCategory(pizzas, cat, fromApi).filter((pizza) =>
        [pizza.name, ...pizza.ingredients, ...pizza.tags]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      ),
    [pizzas, cat, fromApi, search],
  );
  const matchingCombos = useMemo(
    () =>
      combos.filter((combo) =>
        [
          combo.name,
          combo.description,
          ...(combo.comboComponents?.map((component) => component.name) ?? []),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      ),
    [combos, search],
  );

  return (
    <AppFrame withTabs className="reference-screen home-screen">
      <FlowReveal>
        <HomeHeader search={search} onSearchChange={setSearch} />
      </FlowReveal>
      <FlowReveal step={2}>
        <HomeBanners
          key={`${cat}:${search}`}
          pizzas={list.slice(0, 5)}
          loading={isLoading}
        />
      </FlowReveal>
      <OffersRail />
      <nav className="mt-5 grid grid-cols-2 gap-3" aria-label="More ways to enjoy pizza">
        <Link
          href="/group/"
          className="home-shortcut"
        >
          <Users aria-hidden="true" /><ArrowUpRight className="home-shortcut-arrow" aria-hidden="true" />
          {language === "de" ? "Zusammen bestellen" : "Pizza together"}
        </Link>
        <Link
          href="/rewards/"
          className="home-shortcut"
        >
          <Gift aria-hidden="true" /><ArrowUpRight className="home-shortcut-arrow" aria-hidden="true" />
          {language === "de" ? "Prämien & Guthaben" : "Rewards & credit"}
        </Link>
      </nav>
      {(isLoading || matchingCombos.length > 0) && (
        <section className="mt-6" aria-labelledby="home-combos-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">{language === "de" ? "Mehr zusammen" : "Better together"}</p>
              <Typography id="home-combos-title" type="h3" className={hx.h3}>{language === "de" ? "Unsere Combos" : "Our combos"}</Typography>
            </div>
            <Link href="/bundles/" className="inline-flex min-h-11 items-center px-3 text-[13px] font-semibold text-muted">{language === "de" ? "Alle ansehen" : "See all"}</Link>
          </div>
          <div className="home-combo-rail">
            {isLoading && !matchingCombos.length
              ? Array.from({ length: 2 }, (_, index) => <div key={index} className="home-combo-skeleton" />)
              : matchingCombos.map((combo) => <ComboMenuCard key={combo.id} combo={combo} products={pizzas} language={language} />)}
          </div>
        </section>
      )}
      <section className="pizza-night-banner mt-6 overflow-hidden rounded-[30px] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[.18em]">{language === "de" ? "Heute frisch" : "Made for tonight"}</p>
        <h2 className="mt-2 max-w-[16ch] text-3xl font-extrabold leading-tight">{language === "de" ? "Dein Lieblingsabend beginnt hier." : "Your best pizza night starts here."}</h2>
        <Link href="/menu/" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground">{language === "de" ? "Menü entdecken" : "Explore the menu"}</Link>
      </section>
      <UsualPizzas />
      <HomeOrderCard />
      <LastOrderRail />
      {isOffline ? (
        <div className="mt-4 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, "text-warning")}>
            {t("login.offlineBanner")}
          </Typography>
        </div>
      ) : null}

      <FoodCategorySection
        categories={CATEGORIES.map((id) => {
          const categoryPizzas = filterByCategory(pizzas, id, fromApi);
          return {
            id,
            label: t(`category.${id}`),
            count: categoryPizzas.length,
            image: categoryPizzas[0]?.imageUrl || categoryPizzas[0]?.image || "",
          };
        })}
        selected={cat}
        onSelect={(id) => setCat(id as (typeof CATEGORIES)[number])}
        language={language}
        loading={isLoading}
      />

      {isLoading || list.length > 0 ? (
        <section className="mt-8 pb-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Typography type="h3" className={hx.h3}>
              {language === "de" ? "Unsere Pizzen" : "Our pizzas"}
            </Typography>
            <Link
              href="/menu/"
              className="relative z-10 inline-flex min-h-11 items-center px-3 text-[13px] font-semibold text-muted"
            >
              {language === "de" ? "Alle ansehen" : "See all"}
            </Link>
          </div>
          <div className={cn(pizzaStyles.grid, pizzaStyles.homeGrid)} aria-busy={isLoading}>
            {isLoading && list.length === 0
              ? Array.from({ length: 4 }, (_, index) => (
                  <MenuPizzaCardSkeleton key={index} />
                ))
              : list.map((pizza) => (
                  <MenuPizzaCard
                    key={pizza.id}
                    pizza={pizza}
                    language={language}
                  />
                ))}
          </div>
        </section>
      ) : null}
    </AppFrame>
  );
}
