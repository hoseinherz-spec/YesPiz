"use client";

import { useState } from "react";
import type { Ingredient } from "@repo/api";
import styles from "./IngredientStrip.module.css";

function IngredientImage({ ingredient }: { ingredient: Ingredient }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles.image} aria-hidden="true">
      {ingredient.image && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ingredient.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.initial}>{ingredient.name.slice(0, 1)}</span>
      )}
    </span>
  );
}

export function IngredientStrip({
  ingredients,
  names,
  language,
}: {
  ingredients?: Ingredient[];
  names: string[];
  language: string;
}) {
  const entries: Ingredient[] = ingredients?.length
    ? ingredients
    : names.map((name, index) => ({
        id: `legacy-${index}`,
        name,
        slug: "",
        description: "",
        image: "",
      }));
  if (!entries.length) return null;
  const label = language === "de" ? "Belag" : "Toppings";
  return (
    <section className={styles.section} aria-label={label}>
      <h2 className={styles.heading}>{label}</h2>
      <ul className={styles.rail} tabIndex={0} aria-label={label}>
        {entries.map((ingredient) => (
          <li
            key={ingredient.id}
            className={styles.item}
            title={ingredient.description || undefined}
          >
            <IngredientImage
              key={`${ingredient.id}:${ingredient.image}`}
              ingredient={ingredient}
            />
            <span className={styles.name}>{ingredient.name}</span>
            {ingredient.description && (
              <span className="sr-only">{ingredient.description}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
