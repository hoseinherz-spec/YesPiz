"use client";
import { PageHero } from "@repo/ui/mobile-page-transition";
import { AnimatedNumber } from "@/components/AnimatedNumber";


import { Button, Card, Typography } from "@heroui/react";
import { Heart, Plus } from "@repo/icons";
import Link from "next/link";

import { pizzaTagline } from "@/constants/i18n";
import { resolveProductImage } from "@/constants/pizzas";
import { useApp } from "@/context/AppContext";

import { ProductImage } from "../ProductImage/ProductImage";
import { productCard } from "./ProductCard.styles";
import type { ProductCardProps } from "./ProductCard.types";

export function ProductCard({
  pizza,
  variant = "grid",
  subtitle,
  meta,
}: ProductCardProps) {
  const { language, isFavorite, toggleFavorite } = useApp();
  const image = resolveProductImage(pizza);
  const fav = isFavorite(pizza.pizzaId ?? pizza.id);
  const tagline = subtitle ?? pizzaTagline(pizza, language);
  const styles = productCard({ variant });

  const href = `/pizza/?id=${encodeURIComponent(pizza.id)}`;

  const onFavoritePress = () => {
    toggleFavorite(pizza.pizzaId ?? pizza.id);
  };

  if (variant === "row") {
    return (
      <Card className={styles.card()}>
        <Link
          href={href}
          aria-label={pizza.name}
          className={styles.hitArea()}
        />
        <Card.Content className={styles.content()}>
          <div className={styles.imageWrap()}>
            <PageHero id={pizza.id}>
              <ProductImage
                src={image}
                alt={pizza.name}
                className={styles.image()}
              />
            </PageHero>
            <Button
              isIconOnly
              variant="ghost"
              aria-label={
                fav ? `Remove ${pizza.name} from saved` : `Save ${pizza.name}`
              }
              onPress={() => onFavoritePress()}
              className={styles.favorite()}
            >
              <Heart
                size={18}
                fill={fav ? "var(--danger)" : "transparent"}
                color={fav ? "var(--danger)" : "#fff"}
              />
            </Button>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3.5 pointer-events-none">
            <div>
              <Typography type="h6" className={styles.title()}>
                {pizza.name}
              </Typography>
              <Typography type="body-sm" className={styles.subtitle()}>
                {tagline}
              </Typography>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex w-full items-center justify-between gap-2">
                <Typography type="body-sm" className={styles.price()}>
                  <AnimatedNumber currency value={pizza.price} />
                </Typography>
                <span className={styles.addButton()} aria-hidden="true">
                  <Plus size={16} />
                </span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className={styles.card()}>
      <Link href={href} aria-label={pizza.name} className={styles.hitArea()} />
      <div className={styles.imageWrap()}>
        <PageHero id={pizza.id}>
          <ProductImage
            src={image}
            alt={pizza.name}
            className={styles.image()}
          />
        </PageHero>
        <Button
          isIconOnly
          variant="ghost"
          aria-label={
            fav ? `Remove ${pizza.name} from saved` : `Save ${pizza.name}`
          }
          onPress={() => onFavoritePress()}
          className={styles.favorite()}
        >
          <Heart
            size={18}
            fill={fav ? "var(--danger)" : "transparent"}
            color={fav ? "var(--danger)" : "#fff"}
          />
        </Button>
      </div>
      <Card.Content className={styles.content()}>
        <Typography type="h6" className={styles.title()}>
          {pizza.name}
        </Typography>
        <Typography type="body-xs" className={styles.subtitle()}>{meta ?? tagline}</Typography>
        <div className="mt-1 flex items-center justify-between gap-2">
            <Typography type="body-sm" className={styles.price()}>
              <AnimatedNumber currency value={pizza.price} />
            </Typography>
            <span className={styles.addButton()} aria-hidden="true">
              <Plus size={18} />
            </span>
        </div>
      </Card.Content>
    </Card>
  );
}
