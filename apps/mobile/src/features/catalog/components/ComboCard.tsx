"use client";

import Link from "next/link";
import { Avatar, Button } from "@heroui/react";
import type { CatalogPizza } from "@/lib/catalog";
import { resolvePizzaCutout } from "@/constants/media";
import { formatPrice, resolveProductImage } from "@/constants/pizzas";
import { useCart } from "@/context/CartContext";
import { useMenuCatalog } from "@/lib/catalog";
import { ProductImage } from "./ProductImage/ProductImage";
import styles from "./ComboCard.module.css";

export function ComboCard({ pizza, language }: { pizza: CatalogPizza; language: string }) {
  const { addItem } = useCart();
  const { items, menuVersion, fromApi, isOffline } = useMenuCatalog();
  const de = language === "de";
  const parts = pizza.comboComponents ?? [];
  const detailHref = `/combo/${encodeURIComponent(pizza.id)}/`;
  const photo = (part: (typeof parts)[number]) => resolvePizzaCutout(part.imageUrl || resolveProductImage(items.find(p => p.id === part.menuItemId) ?? pizza));
  return (
    <article className={styles.card} aria-labelledby={`combo-${pizza.id}`}>
      <span className={styles.rings} aria-hidden="true" />
      <span className={`${styles.spark} ${styles.sparkOne}`} aria-hidden="true">✦</span>
      <span className={`${styles.spark} ${styles.sparkTwo}`} aria-hidden="true">✦</span>
      <Link className={styles.cardLink} href={detailHref} aria-label={`${pizza.name}, ${formatPrice(pizza.price)}`} />
      <div className={styles.top}>
        <span>{de ? "Zum Teilen" : "Made to share"}</span>
        <strong>{formatPrice(pizza.price)}</strong>
      </div>
      <h2 id={`combo-${pizza.id}`}>{pizza.name}</h2>
      <p className={styles.description}>{pizza.description || pizza.tagline}</p>
      <div className={styles.avatars} role="group" aria-label={de ? "Enthaltene Pizzen" : "Included pizzas"}>
        {parts.slice(0, 5).map((part, i) => (
          <Avatar key={`${part.menuItemId}-${i}`} title={`${part.quantity} × ${part.name}`}>
            <Avatar.Image src={photo(part)} alt={`${part.quantity} × ${part.name}`} />
            <Avatar.Fallback>{part.name.slice(0, 2)}</Avatar.Fallback>
          </Avatar>
        ))}
        {parts.length > 5 && <span className={styles.avatarMore} aria-label={`${parts.length - 5} more items`}>+{parts.length - 5}</span>}
      </div>
      <p className={styles.contents}>{parts.map(p => `${p.quantity} × ${p.name}`).join(" · ")}</p>
      <ProductImage src={parts[0] ? photo(parts[0]) : resolveProductImage(pizza)} alt="" className={styles.pizza} />
      <Button className={styles.add} isDisabled={!fromApi || isOffline} onPress={() => addItem({ menuItemId: pizza.id, menuVersion, name: pizza.name, size: "medium", extras: [], quantity: 1, unitPrice: pizza.price, image: parts[0] ? photo(parts[0]) : resolveProductImage(pizza), selectionLabels: parts.map(p => `${p.quantity} × ${p.name}`) })}>
        {de ? "Hinzufügen" : "Add to cart"}
      </Button>
    </article>
  );
}
