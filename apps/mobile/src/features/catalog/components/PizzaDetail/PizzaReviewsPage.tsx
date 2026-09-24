"use client";

import { ChevronLeft } from "@/components/animated-icon/icons";
import { AppFrame } from "@/components/AppFrame";
import { ScrollHeader } from "@/components/ScrollHeader";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { useApp } from "@/context/AppContext";
import { useMenuCatalog } from "@/lib/catalog";
import { PizzaComments, ReviewStar } from "./PizzaComments";
import { reviewMetrics } from "./review-metrics";
import styles from "./PizzaReviews.module.css";
import { RatingSkeleton, ReviewsSkeleton } from "./PizzaSkeletons";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";

export function PizzaReviewsPage({ id }: { id: string }) {
  const { language } = useApp();
  const { getById, isLoading } = useMenuCatalog();
  const pizza = getById(id);
  const de = language === "de";
  const { rating, reviewCount } = reviewMetrics(pizza?.presentation);
  return (
    <AppFrame padded={false} className={styles.page}>
      <ScrollHeader className={styles.pageHeader}>
        <IconBadgeButton
          href={`/menu/${encodeURIComponent(id)}/`}
          aria-label={de ? "Zurück zu den Details" : "Back to details"}
          className={styles.back}
        >
          <ChevronLeft size={24} />
        </IconBadgeButton>
        <h1>{de ? "Bewertungen" : "Rating & Reviews"}</h1>
      </ScrollHeader>
      {!pizza && isLoading ? (
        <>
          <RatingSkeleton />
          <ReviewsSkeleton full />
        </>
      ) : !pizza ? (
        <p role="status" className={styles.state}>
          {isLoading
            ? de
              ? "Wird geladen…"
              : "Loading…"
            : de
              ? "Pizza nicht gefunden"
              : "Pizza not found"}
        </p>
      ) : (
        <>
          <div className={styles.overview}>
            <div className={styles.score}>
              {rating === null && <ProductImage src="/images/pizzacraft/Pizza Slice.png" alt="" className={styles.scoreEmptyImage} />}
              <strong
                className={rating === null ? "sr-only" : undefined}
                aria-label={
                  rating === null
                    ? de
                      ? "Bewertung nicht verfügbar"
                      : "Rating unavailable"
                    : `${rating} / 5`
                }
              >
                {rating === null ? "—" : rating.toFixed(1)}
              </strong>
              <div className={styles.stars} aria-hidden="true">
                {[0, 1, 2, 3, 4].map((index) => (
                  <ReviewStar
                    key={index}
                    fill={rating === null ? 0 : rating - index}
                  />
                ))}
              </div>
              <p>
                {reviewCount === null
                  ? de
                    ? "Noch keine Gesamtwertung"
                    : "Review total unavailable"
                  : `(${new Intl.NumberFormat(de ? "de-DE" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(reviewCount)} ${de ? "Bewertungen" : "reviews"})`}
              </p>
            </div>
            <div className={styles.distribution}>
              <div aria-hidden="true" className={styles.bars}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className={styles.barRow}>
                    <span>{star}</span>
                    <span className={styles.track} />
                  </div>
                ))}
              </div>
              <p>
                {de
                  ? "Aufschlüsselung nicht verfügbar"
                  : "Rating breakdown unavailable"}
              </p>
            </div>
          </div>
          <PizzaComments id={id} language={language} full />
        </>
      )}
    </AppFrame>
  );
}
