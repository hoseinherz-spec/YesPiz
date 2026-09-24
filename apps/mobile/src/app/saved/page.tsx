"use client";
import { UsualPizzas } from "@/components/UsualPizzas";
import { Button, Card } from "@heroui/react";
import { Heart, Search, Truck } from "@/components/animated-icon/icons";
import Link from "next/link";
import { useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { useMenuCatalog } from "@/lib/catalog";
import { formatPrice, resolveProductImage } from "@/constants/pizzas";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { pizzaCraftAsset } from "@/constants/media";
import { reviewMetrics } from "@/features/catalog/components/PizzaDetail/review-metrics";
import { ReviewStar } from "@/features/catalog/components/PizzaDetail/PizzaComments";
import { FavoritesSkeleton } from "@/features/profile/components/ProfileSkeletons";
import styles from "@/features/profile/components/Profile.module.css";

export default function SavedPage() {
  const [search, setSearch] = useState("");
  const { favorites, toggleFavorite, language, t } = useApp();
  const { baseDeliveryFee } = useCart();
  const { items, isLoading, isOffline } = useMenuCatalog();
  const de = language === "de";
  const saved = items.filter((pizza) =>
    favorites.includes(pizza.pizzaId ?? pizza.id),
  );
  const filtered = saved.filter((pizza) =>
    pizza.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <AppFrame padded={false} className={styles.subpage}>
      <ScreenHeader
        title={de ? "Meine Favoriten" : "My Favorite"}
        backHref="/profile/"
      />
      <label className={styles.search}>
        <Search size={20} />
        <input
          aria-label={de ? "Favoriten durchsuchen" : "Search favorites"}
          placeholder={de ? "Suchen" : "Search"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {isOffline && (
        <p role="status" className={styles.note}>
          {t("login.offlineBanner")}
        </p>
      )}
      {isLoading ? (
        <FavoritesSkeleton />
      ) : !saved.length ? (
        <EmptyState
          icon={<Heart size={28} />}
          image={pizzaCraftAsset("Pizza Slice")}
          title={de ? "Noch keine Favoriten" : "Nothing saved yet"}
          body={
            de
              ? "Speichere deine Lieblingspizza mit dem Herz."
              : "Tap the heart on any pizza to keep it close."
          }
          actionLabel={t("common.browseMenu")}
          actionHref="/menu/"
        />
      ) : (
        <div className={styles.cards}>
          {!filtered.length && (
            <p role="status" className={styles.note}>
              {de
                ? "Keine passenden Favoriten."
                : "No favorites match your search."}
            </p>
          )}
          {filtered.map((pizza) => {
            const { rating, reviewCount } = reviewMetrics(pizza.presentation);
            return (
              <Card key={pizza.id} className={styles.card}>
                <Card.Content className="flex gap-4">
                  <Link
                    href={`/menu/${encodeURIComponent(pizza.id)}/`}
                    className="size-[120px] max-[360px]:size-[96px] shrink-0 overflow-hidden rounded-[20px] bg-surface-secondary"
                  >
                    <ProductImage
                      src={resolveProductImage(pizza)}
                      alt={pizza.name}
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                    <Link
                      className="truncate text-base font-bold"
                      href={`/menu/${encodeURIComponent(pizza.id)}/`}
                    >
                      {pizza.name}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <ReviewStar />
                      {rating === null
                        ? de
                          ? "Noch keine Bewertung"
                          : "Not yet rated"
                        : `${rating.toFixed(1)}${reviewCount === null ? "" : ` (${reviewCount})`}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="rounded-lg bg-surface-secondary px-1 text-xl text-accent">
                        {formatPrice(pizza.price)}
                      </strong>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Truck size={15} />
                        {formatPrice(baseDeliveryFee)}
                      </span>
                      <Button
                        isIconOnly
                        className="ms-auto size-10 min-w-10 rounded-full"
                        aria-label={`${de ? "Entfernen" : "Remove"} ${pizza.name}`}
                        onPress={() =>
                          toggleFavorite(pizza.pizzaId ?? pizza.id)
                        }
                      >
                        <Heart size={20} fill="currentColor" />
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
      <details className="mt-6 text-sm text-muted">
        <summary className="cursor-pointer py-3">{de ? "Deine üblichen Bestellungen" : "Your usual orders"}</summary>
        <UsualPizzas editable />
      </details>
    </AppFrame>
  );
}
