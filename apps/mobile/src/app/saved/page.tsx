"use client";
import { AppText } from "@/components/Text";


import { Button, Typography } from "@heroui/react";
import { Heart, GridFour, ListThreeBullet } from "@repo/icons";
import { useMemo, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { useMenuCatalog } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

export default function SavedPage() {
  const [view, setView] = useState<"grid" | "row">("grid");
  const { favorites, t, language } = useApp();
  const { items, isLoading, isOffline } = useMenuCatalog();

  const saved = useMemo(
    () =>
      items.filter((pizza) => favorites.includes(pizza.pizzaId ?? pizza.id)),
    [favorites, items],
  );

  return (
    <AppFrame withTabs className="reference-screen">
      <ScreenHeader
        title="Saved"
        subtitle={saved.length ? `${saved.length} pizzas` : undefined}
        backHref="/home/"
      />

      {isOffline ? (
        <div className="mt-4 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, "text-warning")}>
            {t("login.offlineBanner")}
          </Typography>
        </div>
      ) : null}

      {isLoading && items.length === 0 ? (
        <div
          className="mt-7 grid grid-cols-2 gap-3"
          aria-label="Loading saved pizzas"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[250px] animate-pulse rounded-[28px] bg-card"
            />
          ))}
        </div>
      ) : saved.length > 0 ? (
        <section className="mt-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <AppText as="h2" className="text-lg font-semibold">
                {language === "de" ? "Deine Favoriten" : "Your favorites"}
              </AppText>
              <AppText as="p" className="mt-1 text-xs text-muted">
                {language === "de"
                  ? "Für den nächsten Pizzaabend"
                  : "Ready for your next pizza night"}
              </AppText>
            </div>
            <div className="flex gap-1 rounded-full border border-border bg-surface-secondary p-1">
              {(
                [
                  {
                    value: "grid",
                    Icon: GridFour,
                    label: language === "de" ? "Rasteransicht" : "Grid view",
                  },
                  {
                    value: "row",
                    Icon: ListThreeBullet,
                    label: language === "de" ? "Listenansicht" : "List view",
                  },
                ] as const
              ).map(({ value, Icon, label }) => (
                <Button
                  key={value}
                  isIconOnly
                  aria-label={label}
                  aria-pressed={view === value}
                  onPress={() => setView(value)}
                  variant={view === value ? "primary" : "ghost"}
                  className="size-10 min-w-10 rounded-full"
                >
                  <Icon size={18} />
                </Button>
              ))}
            </div>
          </div>
          <div
            className={
              view === "grid"
                ? "grid grid-cols-2 gap-x-3 gap-y-6 pb-4"
                : "flex flex-col gap-3 pb-4"
            }
          >
            {saved.map((pizza) => (
              <ProductCard key={pizza.id} pizza={pizza} variant={view} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<Heart size={28} />}
          image="/images/pizza-margherita.png"
          title="Nothing saved yet"
          body="Tap the heart on any pizza to keep it close."
          actionLabel={t("common.browseMenu")}
          actionHref="/menu/"
        />
      )}
    </AppFrame>
  );
}
