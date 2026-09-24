"use client";

import { useRef, type CSSProperties } from "react";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import styles from "./FoodCategorySection.module.css";
import { Skeleton } from "@heroui/react";

type Category = { id: string; label: string; count: number; image: string };
const artwork: Record<string, { icon: string; color: string }> = {
  Popular: {
    icon: "❤️",
    color: "color-mix(in oklab, var(--danger) 14%, var(--card))",
  },
  Classic: {
    icon: "🍕",
    color: "color-mix(in oklab, var(--warning) 16%, var(--card))",
  },
  Spicy: {
    icon: "🌶️",
    color: "color-mix(in oklab, var(--danger) 11%, var(--card))",
  },
  Veggie: {
    icon: "🥬",
    color: "color-mix(in oklab, var(--success) 13%, var(--card))",
  },
  Premium: {
    icon: "👑",
    color: "color-mix(in oklab, var(--accent) 12%, var(--card))",
  },
};

export function FoodCategorySection({
  categories,
  selected,
  onSelect,
  language,
  loading,
  compact = false,
}: {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
  language: string;
  loading: boolean;
  compact?: boolean;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const de = language === "de";
  const visible = categories.filter(
    (category) =>
      category.id !== "All",
  );

  function select(id: string) {
    onSelect(selected === id ? "All" : id);
  }

  return (
    <section className={styles.section} data-compact={compact || undefined} aria-labelledby="food-category-heading">
      <h2 id="food-category-heading" className={styles.heading}>
        {compact ? (de ? "Kategorien entdecken" : "Browse categories") : de ? (
          <>
            Worauf hast
            <br />
            du heute Lust?
          </>
        ) : (
          <>
            Find your
            <br />
            favorite pizza.
          </>
        )}
      </h2>
      <div
        ref={rail}
        id="food-category-rail"
        className={styles.rail}
        aria-busy={loading}
      >
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
                <Skeleton className={styles.skeletonImage} />
                <Skeleton className={styles.skeletonTitle} />
                <Skeleton className={styles.skeletonCount} />
              </div>
            ))
          : visible.map((category) => (
          <button
            key={category.id}
            type="button"
            className={styles.card}
            style={
              {
                "--category-surface": artwork[category.id]?.color,
              } as CSSProperties
            }
            onClick={() => select(category.id)}
            aria-pressed={selected === category.id}
          >
            <div className={styles.image}>
              <ProductImage
                src={category.image}
                alt=""
                className={styles.pizza}
              />
            </div>
            <h3>{category.label}</h3>
            <p>
              {loading
                ? de
                  ? "Wird geladen…"
                  : "Loading…"
                : `${category.count} ${de ? "Pizzen" : category.count === 1 ? "pizza" : "pizzas"}`}
            </p>
          </button>
          ))}
      </div>
      <p className={styles.hint} role="status">
        {selected === "All"
          ? de
            ? "Wischen und Lieblingspizza entdecken"
            : "Swipe to find your favorite"
          : de
            ? "Deine Auswahl findest du unten"
            : "Explore your selection below"}
      </p>
    </section>
  );
}
