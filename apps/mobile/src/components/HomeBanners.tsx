"use client";

import Link from "next/link";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { PageHero } from "@repo/ui/mobile-page-transition";
import { useReducedMotion } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, EffectCards, Keyboard, Pagination } from "swiper/modules";
import { Heart } from "@/components/animated-icon/icons";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { useApp } from "@/context/AppContext";
import type { CatalogPizza } from "@/lib/catalog";
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";
import styles from "./HomeBanners.module.css";

export function HomeBanners({
  pizzas,
  loading,
}: {
  pizzas: CatalogPizza[];
  loading: boolean;
}) {
  const { language, isFavorite, toggleFavorite } = useApp();
  const reducedMotion = useReducedMotion();
  const de = language === "de";
  if (loading)
    return (
      <div className={styles.skeleton} role="status">
        {de ? "Pizzen werden geladen…" : "Loading pizzas…"}
      </div>
    );
  if (!pizzas.length)
    return (
      <div className={styles.empty} role="status">
        {de
          ? "Keine passenden Pizzen gefunden."
          : "No pizzas match your selection."}
      </div>
    );
  return (
    <section
      className={styles.banners}
      aria-label={de ? "Pizza-Highlights" : "Featured pizza banners"}
    >
      <Swiper
        modules={[EffectCards, Pagination, Keyboard, A11y]}
        effect="cards"
        grabCursor
        cardsEffect={{
          perSlideOffset: 5,
          perSlideRotate: 3,
          slideShadows: false,
          rotate: !reducedMotion,
        }}
        speed={reducedMotion ? 0 : 450}
        keyboard={{ enabled: true, onlyInViewport: true }}
        pagination={{ clickable: true }}
        rewind
        className={styles.carousel}
      >
        {pizzas.map((pizza) => {
          const favoriteId = pizza.pizzaId ?? pizza.id;
          const saved = isFavorite(favoriteId);
          return (
            <SwiperSlide key={pizza.id} className={styles.slide}>
              {({ isActive }) => (
                <article className={styles.banner} inert={!isActive}>
                  <div className={styles.eyebrow}>
                    <span aria-hidden="true">✦</span>{" "}
                    {de ? "Für dich" : "Fresh picks"}
                  </div>
                  <IconBadgeButton
                    className={styles.favorite}
                    aria-pressed={saved}
                    aria-label={
                      de
                        ? `${pizza.name} ${saved ? "entfernen" : "speichern"}`
                        : `${saved ? "Unsave" : "Save"} ${pizza.name}`
                    }
                    onPress={() => toggleFavorite(favoriteId)}
                  >
                    <Heart size={24} fill={saved ? "currentColor" : "none"} />
                  </IconBadgeButton>
                  <div className={styles.copy}>
                    <p className={styles.name}>{pizza.name}</p>
                    <h2>{de ? "Pizza-Liebe." : "Pizza love."}</h2>
                    <div className={styles.ingredients}>
                      {pizza.ingredients.slice(0, 3).map((ingredient) => (
                        <span key={ingredient}>{ingredient}</span>
                      ))}
                      {pizza.ingredients.length > 3 && (
                        <span>+{pizza.ingredients.length - 3}</span>
                      )}
                    </div>
                    <p className={styles.price}>
                      <AnimatedNumber currency value={pizza.price} />
                    </p>
                  </div>
                  <PageHero id={`featured-${pizza.id}`}>
                    <div className={styles.artwork}>
                      <ProductImage
                        src={pizza.imageUrl || pizza.image}
                        alt={pizza.name}
                        className={styles.pizza}
                      />
                    </div>
                  </PageHero>
                  <Link
                    href={`/menu/${encodeURIComponent(pizza.id)}/?source=featured`}
                    className={styles.order}
                  >
                    {de ? "Jetzt bestellen" : "Order now"}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
