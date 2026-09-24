"use client";

import { Button, Skeleton } from "@heroui/react";
import { Bookmark } from "lucide-react";
import { ChevronLeft } from "@/components/animated-icon/icons";
import { AppFrame } from "@/components/AppFrame";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { ProductImage } from "./ProductImage/ProductImage";
import { formatPrice } from "@/constants/pizzas";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { usePublishedComboQuery } from "@repo/api";
import Link from "next/link";
import styles from "./ComboDetail.module.css";

export function ComboDetail({ id }: { id: string }) {
  const { language, isFavorite, toggleFavorite } = useApp();
  const { addItem } = useCart();
  const query = usePublishedComboQuery(id, language);
  const de = language === "de";

  if (query.isLoading) {
    return (
      <AppFrame padded={false} className={styles.page}>
        <div className={styles.loading} role="status" aria-label={de ? "Combo wird geladen" : "Loading combo"}>
          <Skeleton className="h-14 w-3/4 rounded-xl" />
          <Skeleton className="mt-5 aspect-square w-full rounded-full" />
          <Skeleton className="mt-8 h-36 w-full rounded-3xl" />
        </div>
      </AppFrame>
    );
  }

  const response = query.data;
  if (!response?.item.comboComponents?.length) {
    return (
      <AppFrame className={styles.notFound}>
        <h1>{de ? "Combo nicht gefunden" : "Combo not found"}</h1>
        <Link href="/menu/">{de ? "Zurück zum Menü" : "Back to menu"}</Link>
      </AppFrame>
    );
  }

  const combo = response.item;
  const parts = combo.comboComponents!;
  const favorite = isFavorite(combo.pizzaId ?? combo.id);
  const heroImage = parts[0]?.imageUrl ?? combo.imageUrl ?? "";
  const labels = parts.map((part) => `${part.quantity} × ${part.name}`);
  const price = combo.priceCents / 100;

  return (
    <AppFrame padded={false} className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.rings} aria-hidden="true" />
        <span className={`${styles.spark} ${styles.sparkOne}`} aria-hidden="true">✦</span>
        <span className={`${styles.spark} ${styles.sparkTwo}`} aria-hidden="true">✦</span>
        <header className={styles.header}>
          <IconBadgeButton href="/menu/" aria-label={de ? "Zurück zum Menü" : "Back to menu"} className={styles.iconButton}>
            <ChevronLeft size={23} />
          </IconBadgeButton>
          <IconBadgeButton
            aria-label={favorite ? (de ? "Combo entfernen" : "Remove saved combo") : (de ? "Combo speichern" : "Save combo")}
            aria-pressed={favorite}
            onPress={() => toggleFavorite(combo.pizzaId ?? combo.id)}
            className={styles.iconButton}
          >
            <Bookmark size={22} fill={favorite ? "currentColor" : "none"} />
          </IconBadgeButton>
        </header>
        <div className={styles.copy}>
          <span>{de ? "Zum Teilen" : "Made to share"}</span>
          <h1>{combo.name}</h1>
          <p>{combo.description}</p>
          <strong>{formatPrice(price)}</strong>
        </div>
        <div className={styles.heroPizzas} aria-hidden="true">
          {parts.slice(0, 2).map((part, index) => (
            <ProductImage key={`${part.menuItemId}-${index}`} src={part.imageUrl ?? combo.imageUrl ?? ""} alt="" className={styles.heroPizza} />
          ))}
        </div>
      </section>

      <section className={styles.contents} aria-labelledby="combo-contents-title">
        <p>{parts.reduce((sum, part) => sum + part.quantity, 0)} {de ? "Pizzen enthalten" : "pizzas included"}</p>
        <h2 id="combo-contents-title">{de ? "In diesem Combo" : "Inside this combo"}</h2>
        <div className={styles.partList}>
          {parts.map((part, index) => (
            <div className={styles.part} key={`${part.menuItemId}-${index}`}>
              <ProductImage src={part.imageUrl ?? ""} alt="" className={styles.partImage} />
              <div>
                <h3>{part.name}</h3>
                <span>{part.sizeName}</span>
              </div>
              <strong>× {part.quantity}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.actionBar}>
        <Button
          className={styles.add}
          onPress={() => addItem({
            menuItemId: combo.id,
            menuVersion: response.version.version,
            name: combo.name,
            size: "medium",
            extras: [],
            quantity: 1,
            unitPrice: price,
            image: heroImage,
            selectionLabels: labels,
          })}
        >
          {de ? "Combo hinzufügen" : "Add combo"} · {formatPrice(price)}
        </Button>
      </div>
    </AppFrame>
  );
}
