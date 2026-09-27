"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ChevronLeft, User, X } from "@/components/animated-icon/icons";
import { AppFrame } from "@/components/AppFrame";
import { ScrollHeader } from "@/components/ScrollHeader";
import { Search } from "@/components/Search";
import { useApp } from "@/context/AppContext";
import { BasketSheet } from "@/features/cart/components/Basket";
import { useMenuCatalog } from "@/lib/catalog";
import styles from "./PizzaBrowse.module.css";
import { MenuPizzaCard, MenuPizzaCardSkeleton } from "./MenuPizzaCard";
import { ComboMenuCard } from "./ComboMenuCard";
import { FoodCategorySection } from "@/components/FoodCategorySection";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { EASE_OUT } from "@/lib/ease";

export function PizzaBrowse() {
  const { language, t } = useApp();
  const de = language === "de";
  const { items, categories, isLoading, isOffline, refetch } = useMenuCatalog();
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [searching, setSearching] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [width, setWidth] = useState(260);
  const searchRow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = searchRow.current;
    if (!row) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(64, entry.contentRect.width - 92));
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const { combos, list } = useMemo(() => {
    const matches = items.filter((pizza) => {
        const matchesCategory =
          category === "all" ||
          pizza.categoryId === category ||
          pizza.additionalCategoryIds?.includes(category);
        return (
          matchesCategory &&
          [pizza.name, pizza.tagline, ...pizza.ingredients]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase())
        );
      });
    return {
      combos: matches.filter((item) => item.comboComponents?.length),
      list: matches.filter((item) => !item.comboComponents?.length),
    };
  }, [items, query, category]);
  const products = useMemo(
    () => items.filter((item) => !item.comboComponents?.length),
    [items],
  );
  const spring = reducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: EASE_OUT };

  function toggleSearch(open: boolean) {
    setSearching(open);
    if (open) window.scrollTo({ top: 0, behavior: "instant" });
  }

  function closeSearch() {
    setSearching(false);
    setQuery("");
    setResetKey((key) => key + 1);
    requestAnimationFrame(() =>
      searchRow.current?.querySelector<HTMLButtonElement>(".sek-hit")?.focus(),
    );
  }

  return (
    <AppFrame padded={false} className={styles.page}>
      <ScrollHeader>
        <div className={styles.header}>
          <IconBadgeButton
            className={styles.roundButton}
            href="/home/"
            aria-label={de ? "Zur Startseite" : "Back to home"}
          >
            <ChevronLeft size={23} />
          </IconBadgeButton>
          <IconBadgeButton
            className={styles.roundButton}
            href="/profile/"
            aria-label={de ? "Dein Profil" : "Your profile"}
          >
            <User size={23} />
          </IconBadgeButton>
        </div>
      </ScrollHeader>
      <motion.div
        className={styles.intro}
        initial={false}
        animate={{
          height: searching ? 0 : "auto",
          opacity: searching ? 0 : 1,
          scale: searching ? 0.96 : 1,
        }}
        transition={spring}
        inert={searching}
      >
        <h1>
          {de ? (
            <>
              Bestell deine
              <br />
              Lieblingspizza.
            </>
          ) : (
            <>
              Order your
              <br />
              favorite pizza.
            </>
          )}
        </h1>
      </motion.div>

      <div ref={searchRow} className={styles.searchRow} data-searching={searching}>
        <Search
          key={resetKey}
          width={width}
          onValueChange={setQuery}
          onOpenChange={toggleSearch}
          placeholder={de ? "Pizza suchen" : "Search pizzas"}
        />
        {searching && (
          <IconBadgeButton
            className={styles.close}
            onPress={closeSearch}
            aria-label={de ? "Suche schließen" : "Close search"}
          >
            <X size={21} />
          </IconBadgeButton>
        )}
      </div>

      {(isLoading || categories.length > 0) && <FoodCategorySection
        compact
        categories={categories.map((option) => {
          const matching = items.filter((pizza) => pizza.categoryId === option.id || pizza.additionalCategoryIds?.includes(option.id));
          return { id: option.id, label: option.name, count: matching.length, image: matching[0]?.image ?? "" };
        })}
        selected={category === "all" ? "All" : category}
        onSelect={(id) => setCategory(id === "All" ? "all" : id)}
        language={language}
        loading={isLoading}
      />}
      {isOffline && (
        <div className={styles.offline}>
          <p>{t("login.offlineBanner")}</p>
          <button type="button" onClick={() => void refetch()}>
            {de ? "Erneut versuchen" : "Try again"}
          </button>
        </div>
      )}
      {(isLoading || combos.length > 0) && (
        <section className={styles.comboSection} aria-labelledby="menu-combos-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>{de ? "Zum Teilen" : "Made to share"}</span>
              <h2 id="menu-combos-title">{de ? "Combos" : "Combos"}</h2>
            </div>
            <Link href="/bundles/">{de ? "Alle ansehen" : "See all"}</Link>
          </div>
          <div className={styles.comboGrid}>
            {isLoading && !combos.length
              ? Array.from({ length: 2 }, (_, index) => (
                  <div key={index} className={styles.comboSkeleton} />
                ))
              : combos.map((combo) => (
                  <ComboMenuCard key={combo.id} combo={combo} products={products} language={language} />
                ))}
          </div>
        </section>
      )}

      {list.length > 0 && (
        <div className={styles.sectionHeading}>
          <div>
            <span role="status">
              {list.length} {de ? "Pizzen" : list.length === 1 ? "pizza" : "pizzas"} · {de ? "Frisch gebacken" : "Freshly baked"}
            </span>
            <h2>{de ? "Pizzen" : "Pizzas"}</h2>
          </div>
        </div>
      )}

      <motion.div
        layout="position"
        transition={spring}
        className={styles.grid}
        aria-busy={isLoading}
      >
        {isLoading && items.length === 0
          ? Array.from({ length: 4 }, (_, index) => (
              <MenuPizzaCardSkeleton key={index} />
            ))
          : list.map((pizza) => (
              <MenuPizzaCard key={pizza.id} pizza={pizza} language={language} />
            ))}
      </motion.div>
      {!isLoading && !list.length && !combos.length && (
        <div className={styles.empty}>
          <h2>{de ? "Keine Pizza gefunden" : "No pizzas found"}</h2>
          <p>
            {query || category !== "all"
              ? de
                ? "Versuche einen anderen Namen oder eine Zutat."
                : "Try another name or ingredient."
              : de
                ? "Aktuell ist kein Produkt veröffentlicht."
                : "No products are published right now."}
          </p>
          {query || category !== "all" ? (
          <button
            type="button"
            onClick={() => {
              closeSearch();
              setCategory("all");
            }}
          >
            {de ? "Filter zurücksetzen" : "Reset search & filters"}
          </button>
          ) : null}
        </div>
      )}

      {!searching && <BasketSheet />}
    </AppFrame>
  );
}
