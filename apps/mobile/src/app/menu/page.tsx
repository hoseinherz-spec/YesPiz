"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";

import { SearchField, RadioField, FormScope, FormAction } from "@repo/ui/forms";

import { Button, Drawer, Typography } from "@heroui/react";
import { ArrowLeft, Bookmark, Search, SlidersHorizontal } from "@repo/icons";
import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { useApp } from "@/context/AppContext";
import { useMenuCatalog } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

const SORTS = ["Recommended", "Low Price", "High Price"] as const;
const PRICES = ["Any price", "Under €12", "€12–€14", "€14+"] as const;

type Category = string;
type Sort = (typeof SORTS)[number];
type Price = (typeof PRICES)[number];

function matchesPrice(price: number, filter: Price) {
  if (filter === "Under €12") return price < 12;
  if (filter === "€12–€14") return price >= 12 && price < 14;
  if (filter === "€14+") return price >= 14;
  return true;
}

export default function MenuPage() {
  const router = useRouter();
  const { t, language } = useApp();
  const de = language === "de";
  const labels: Record<string, string> = {
    Recommended: "Empfohlen",
    "Low Price": "Preis aufsteigend",
    "High Price": "Preis absteigend",
    "Any price": "Alle Preise",
    "Under €12": "Unter 12 €",
    "€12–€14": "12–14 €",
    "€14+": "Ab 14 €",
  };
  const [diet, setDiet] = useState("all");
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("yespizz_diet");
        if (stored && ["all", "vegetarian", "vegan"].includes(stored))
          setDiet(stored);
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function chooseDiet(value: string) {
    setDiet(value);
    try {
      localStorage.setItem("yespizz_diet", value);
    } catch {}
  }

  const { items, categories, isOffline, isLoading, isFetching, refetch } =
    useMenuCatalog();
  const categoryOptions = [{ id: "All", name: "All" }, ...categories];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<Sort>("Recommended");
  const [price, setPrice] = useState<Price>("Any price");
  const [draftCategory, setDraftCategory] = useState<Category>("All");
  const [draftSort, setDraftSort] = useState<Sort>("Recommended");
  const [draftPrice, setDraftPrice] = useState<Price>("Any price");

  const list = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let next = items.filter((pizza) => {
      const haystack = [pizza.name, pizza.tagline, ...pizza.ingredients]
        .join(" ")
        .toLowerCase();
      return (
        haystack.includes(normalizedQuery) &&
        (diet === "all" ||
          pizza.tags.some((tag) => tag.toLowerCase() === diet)) &&
        (category === "All" ||
          pizza.categoryId === category ||
          !!pizza.additionalCategoryIds?.includes(category)) &&
        matchesPrice(pizza.price, price)
      );
    });
    if (sort === "Low Price")
      next = [...next].sort((a, b) => a.price - b.price);
    if (sort === "High Price")
      next = [...next].sort((a, b) => b.price - a.price);
    return next;
  }, [category, items, price, query, sort, diet]);

  const activeFilters =
    Number(diet !== "all") +
    Number(category !== "All") +
    Number(sort !== "Recommended") +
    Number(price !== "Any price");

  const prepareFilters = () => {
    setDraftCategory(category);
    setDraftSort(sort);
    setDraftPrice(price);
  };

  const applyFilters = () => {
    setCategory(draftCategory);
    setSort(draftSort);
    setPrice(draftPrice);
  };

  const clearFilters = () => {
    chooseDiet("all");
    setQuery("");
    setCategory("All");
    setSort("Recommended");
    setPrice("Any price");
    setDraftCategory("All");
    setDraftSort("Recommended");
    setDraftPrice("Any price");
  };

  return (
    <AppFrame withTabs className="reference-screen menu-screen">
      <div className="flex items-center justify-between gap-3">
        <IconBadgeButton
          aria-label="Back to home"
          onPress={() => router.push("/home/")}
        >
          <ArrowLeft size={20} />
        </IconBadgeButton>
        <Typography type="h3" className={hx.h3}>
          {t("menu.title")}
        </Typography>
        <IconBadgeButton href="/saved/" aria-label="Saved pizzas">
          <Bookmark size={19} />
        </IconBadgeButton>
      </div>

      <div
        className="my-4 flex flex-wrap gap-2"
        aria-label={de ? "Ernährungsweise" : "Dietary preference"}
      >
        {[
          { id: "all", en: "All pizzas", de: "Alle Pizzen" },
          { id: "vegetarian", en: "Vegetarian", de: "Vegetarisch" },
          { id: "vegan", en: "Vegan", de: "Vegan" },
        ].map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={diet === d.id}
            onClick={() => chooseDiet(d.id)}
            className={`min-h-11 rounded-full border border-border px-4 text-xs font-semibold ${diet === d.id ? "bg-accent text-accent-foreground" : "bg-surface-secondary"}`}
          >
            {de ? d.de : d.en}
          </button>
        ))}
      </div>
      {isOffline ? (
        <div className="mt-5 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, "text-warning")}>
            {t("login.offlineBanner")}
          </Typography>
          <Button
            variant="ghost"
            isPending={isFetching}
            onPress={() => {
              void refetch();
            }}
            className="mt-2 min-h-11 px-0 text-sm font-semibold text-foreground underline underline-offset-4"
          >
            {t("menu.retryConnection")}
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_64px] gap-2">
        <SearchField
          className="w-full"
          value={query}
          onChange={setQuery}
          aria-label={t("menu.search")}
        >
          <SearchField.Group className="h-16 rounded-full border-0 bg-field-background px-3 shadow-none">
            <SearchField.SearchIcon className="text-muted" />
            <SearchField.Input
              placeholder={t("menu.search")}
              className="text-[14px] font-medium text-foreground placeholder:text-field-placeholder"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <Drawer>
          <Button
            isIconOnly
            variant="secondary"
            aria-label="Open filters"
            onPress={prepareFilters}
            className="relative size-16 min-w-16 rounded-full border-0 bg-field-background text-foreground"
          >
            <SlidersHorizontal size={21} />
            {activeFilters > 0 ? (
              <AppText
                as="span"
                className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-extrabold text-accent-foreground"
              >
                <AnimatedNumber value={activeFilters} />
              </AppText>
            ) : null}
          </Button>
          <Drawer.Backdrop className="bg-black/60 backdrop-blur-sm">
            <Drawer.Content
              placement="bottom"
              className="mx-auto max-h-[88dvh] w-full max-w-[473px] rounded-t-[42px] bg-surface text-surface-foreground"
            >
              <FormScope>
                <Drawer.Dialog className="outline-none">
                  <Drawer.Handle className="bg-muted" />
                  <Drawer.Header className="flex items-center justify-between px-[clamp(22px,8vw,38px)] pt-3">
                    <Drawer.Heading className="text-[27px] font-extrabold">
                      Filters
                    </Drawer.Heading>
                    <Button
                      variant="ghost"
                      onPress={() => {
                        setDraftCategory("All");
                        setDraftSort("Recommended");
                        setDraftPrice("Any price");
                      }}
                      className="rounded-full text-[13px] text-muted"
                    >
                      {de ? "Zurücksetzen" : "Reset"}
                    </Button>
                  </Drawer.Header>
                  <Drawer.Body className="px-[clamp(22px,8vw,38px)] pb-3">
                    <RadioField
                      label={de ? "Kategorien" : "Categories"}
                      required
                      value={draftCategory}
                      onChange={setDraftCategory}
                      options={categoryOptions.map((o) => ({
                        id: o.id,
                        label: o.name,
                      }))}
                    />

                    <RadioField
                      label={de ? "Sortieren" : "Sort by"}
                      required
                      value={draftSort}
                      onChange={(v) => setDraftSort(v as Sort)}
                      options={SORTS.map((v) => ({
                        id: v,
                        label: de ? (labels[v] ?? v) : v,
                      }))}
                    />

                    <RadioField
                      label={de ? "Preisbereich" : "Price range"}
                      required
                      value={draftPrice}
                      onChange={(v) => setDraftPrice(v as Price)}
                      options={PRICES.map((v) => ({
                        id: v,
                        label: de ? (labels[v] ?? v) : v,
                      }))}
                    />
                  </Drawer.Body>
                  <Drawer.Footer className="px-[clamp(22px,8vw,38px)] pb-[max(20px,env(safe-area-inset-bottom))]">
                    <FormAction
                      slot="close"
                      variant="primary"
                      fullWidth
                      onPress={applyFilters}
                      className={hx.btnPrimary}
                    >
                      {de ? "Filter anwenden" : "Apply filters"}
                    </FormAction>
                  </Drawer.Footer>
                </Drawer.Dialog>
              </FormScope>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      </div>

      <div className="mt-7 flex items-end justify-between gap-3">
        <Typography
          type="h1"
          className={cn(hx.h1, "max-w-[270px] text-[clamp(30px,9vw,42px)]")}
        >
          {isLoading && items.length === 0
            ? t("menu.title")
            : `${list.length} ${list.length === 1 ? "pizza" : "pizzas"}`}
        </Typography>
        <Search size={34} color="var(--foreground)" />
      </div>

      <div className="menu-categories" aria-label={t("menu.title")}>
        {categoryOptions.map((option) => (
          <Button
            key={option.id}
            aria-pressed={category === option.id}
            variant={category === option.id ? "primary" : "secondary"}
            onPress={() => setCategory(option.id)}
            className="rounded-full shrink-0"
          >
            {option.id === "All" ? t("category.All") : option.name}
          </Button>
        ))}
      </div>

      {isLoading && items.length === 0 ? (
        <div className="mt-7 flex flex-col gap-4" aria-label="Loading menu">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[132px] animate-pulse rounded-[22px] bg-card"
            />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4 pb-4">
          {list.map((pizza) => (
            <ProductCard key={pizza.id} pizza={pizza} variant="row" />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-[32px] border border-border px-5 py-10 text-center">
          <Search size={34} color="var(--muted)" />
          <Typography type="h3" className={cn(hx.h3, "mt-4")}>
            No pizzas found
          </Typography>
          <Typography
            type="body-sm"
            className={cn(hx.bodySm, "mt-2 max-w-[260px]")}
          >
            {de
              ? "Versuche eine andere Suche oder setze die Filter zurück."
              : "Try another search or reset your filters."}
          </Typography>
          <Button
            variant="primary"
            className="mt-5 rounded-full px-6"
            onPress={clearFilters}
          >
            {de ? "Filter zurücksetzen" : "Clear filters"}
          </Button>
        </div>
      )}
    </AppFrame>
  );
}
