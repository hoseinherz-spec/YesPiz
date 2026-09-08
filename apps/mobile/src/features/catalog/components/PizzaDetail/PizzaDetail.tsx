"use client";

import { Button, Typography, buttonVariants } from "@heroui/react";
import {
  ArrowLeft,
  Check,
  Clock,
  Heart,
  ShoppingBag,
  Truck,
} from "@repo/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Stepper } from "@/components/Stepper";
import {
  pizzaDescription,
  pizzaIngredients,
  pizzaTagline,
} from "@/constants/i18n";
import { formatPrice, resolveProductImage } from "@/constants/pizzas";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { useMenuCatalog } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

import { ProductImage } from "../ProductImage/ProductImage";
import type { PizzaDetailProps } from "./PizzaDetail.types";

export function PizzaDetail({ id }: PizzaDetailProps) {
  const router = useRouter();
  const { t, language, isFavorite, toggleFavorite } = useApp();
  const { addItem, count, sizes, extraOptions, baseDeliveryFee } = useCart();
  const { getById, menuVersion, fromApi, isLoading, isOffline } =
    useMenuCatalog();
  const pizza = getById(id);

  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const unit = useMemo(
    () =>
      pizza
        ? Math.max(
            0,
            pizza.price + (sizes.find((s) => s.id === size)?.delta ?? 0),
          ) +
          extras.reduce(
            (sum, id) =>
              sum + (extraOptions.find((e) => e.id === id)?.price ?? 0),
            0,
          )
        : 0,
    [pizza, size, extras, sizes, extraOptions],
  );
  const total = unit * qty;

  if (isLoading && !pizza) {
    return (
      <AppFrame padded={false}>
        <div
          className="h-dvh animate-pulse bg-card"
          aria-label="Loading pizza details"
        />
      </AppFrame>
    );
  }

  if (!pizza) {
    return (
      <AppFrame>
        <Typography type="h2" className={hx.h2}>
          {t("pizza.notFound")}
        </Typography>
        <div className="mt-6">
          <Link
            href="/menu/"
            className={cn(
              buttonVariants({ variant: "primary", fullWidth: true }),
              hx.btnPrimary,
            )}
          >
            {t("common.browseMenu")}
          </Link>
        </div>
      </AppFrame>
    );
  }

  const fav = isFavorite(pizza.id);
  const image = resolveProductImage(pizza);

  const toggleExtra = (extraId: string) => {
    setExtras((prev) =>
      prev.includes(extraId)
        ? prev.filter((x) => x !== extraId)
        : [...prev, extraId],
    );
  };

  const add = () => {
    addItem({
      menuItemId: pizza.id,
      menuVersion: fromApi ? menuVersion : 0,
      name: pizza.name,
      size,
      extras,
      quantity: qty,
      unitPrice: unit,
      image,
    });
    router.push("/cart/");
  };

  return (
    <AppFrame padded={false} className="!pb-32">
      <div className="px-[clamp(20px,8vw,38px)] pt-[max(28px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <IconBadgeButton aria-label="Back" onPress={() => router.back()}>
            <ArrowLeft size={20} />
          </IconBadgeButton>
          <Typography type="h3" className={cn(hx.h3, "text-[18px]")}>
            Pizza details
          </Typography>
          <div className="flex gap-2">
            <IconBadgeButton
              aria-label={
                fav ? `Remove ${pizza.name} from saved` : `Save ${pizza.name}`
              }
              onPress={() => toggleFavorite(pizza.id)}
              className={fav ? "bg-danger-soft" : undefined}
            >
              <Heart
                size={18}
                fill={fav ? "var(--danger)" : "transparent"}
                color={fav ? "var(--danger)" : "var(--foreground)"}
              />
            </IconBadgeButton>
            <IconBadgeButton href="/cart/" aria-label="Cart" badge={count}>
              <ShoppingBag size={18} />
            </IconBadgeButton>
          </div>
        </div>

        {isOffline ? (
          <Typography
            type="body-xs"
            className={cn(hx.caption, "mt-4 text-warning")}
          >
            {t("login.offlineBanner")}
          </Typography>
        ) : null}

        <div className="mt-8 flex items-end justify-between gap-4 pb-7">
          <div className="min-w-0">
            <Typography
              type="h1"
              className={cn(hx.h1, "text-[clamp(32px,10vw,44px)]")}
            >
              {pizza.name}
            </Typography>
            <Typography type="body-sm" className={cn(hx.bodySm, "mt-2")}>
              {pizzaTagline(pizza, language)}
            </Typography>
          </div>
          <Typography
            type="h2"
            className={cn(hx.h2, "shrink-0 text-[clamp(24px,7vw,32px)]")}
          >
            {formatPrice(pizza.price)}
          </Typography>
        </div>
      </div>

      <div className="flex-1 rounded-t-[44px] bg-accent px-[clamp(20px,8vw,38px)] pt-4 pb-10 text-accent-foreground">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[rgba(17,17,23,0.12)]" />
        <div className="h-[clamp(230px,67vw,315px)]">
          <ProductImage
            src={image}
            alt={pizza.name}
            className="h-full w-full object-contain"
            fallbackClassName="text-accent-foreground [&>svg]:size-28"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-bold text-accent-foreground">
            ★ {pizza.rating.toFixed(1)} ({pizza.reviews})
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-[rgba(17,17,23,0.62)]">
            <Clock size={13} /> {pizza.prepTime} {t("common.min")}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent-foreground">
            <Truck size={13} /> {t("common.delivery")}{" "}
            {formatPrice(baseDeliveryFee)}
          </span>
        </div>

        <Typography
          type="body"
          className="mt-4 text-[14px] leading-6 text-[rgba(17,17,23,0.68)]"
        >
          {pizzaDescription(pizza, language)}
        </Typography>

        <Typography
          type="h6"
          className="mt-7 mb-3 text-[18px] font-extrabold text-accent-foreground"
        >
          {t("pizza.ingredients")}
        </Typography>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {pizzaIngredients(pizza, language).map((ingredient, index) => (
            <div key={ingredient} className="w-[78px] shrink-0 text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.7)] text-[24px] shadow-sm">
                {["🍅", "🧀", "🌿", "🫒", "🌶️"][index % 5]}
              </span>
              <span className="mt-2 block line-clamp-2 text-[11px] font-bold text-accent-foreground">
                {ingredient}
              </span>
            </div>
          ))}
        </div>

        <Typography
          type="h6"
          className="mt-7 mb-3 text-[18px] font-extrabold text-accent-foreground"
        >
          {t("pizza.chooseSize")}
        </Typography>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((s) => {
            const active = size === s.id;
            return (
              <Button
                key={s.id}
                variant={active ? "primary" : "secondary"}
                onPress={() => setSize(s.id)}
                className={cn(
                  "h-auto flex-col rounded-[20px] border-0 px-2 py-3.5 shadow-none",
                  active
                    ? "bg-accent-foreground text-accent"
                    : "bg-[rgba(255,255,255,0.58)] text-accent-foreground",
                )}
              >
                <span className="text-[14px] font-bold">
                  {t(`size.${s.id}`)}
                </span>
                <span className="mt-0.5 text-[11px] opacity-70">
                  {s.delta === 0
                    ? t("pizza.base")
                    : s.delta > 0
                      ? `+€${s.delta}`
                      : `€${s.delta}`}
                </span>
              </Button>
            );
          })}
        </div>

        <Typography
          type="h6"
          className="mt-7 mb-3 text-[18px] font-extrabold text-accent-foreground"
        >
          {t("pizza.addExtras")}
        </Typography>
        <div className="flex flex-col gap-2">
          {extraOptions.map((extra) => {
            const on = extras.includes(extra.id);
            return (
              <Button
                key={extra.id}
                variant="secondary"
                onPress={() => toggleExtra(extra.id)}
                className={cn(
                  "h-auto w-full justify-start gap-3 rounded-[20px] border-0 px-3 py-3 text-left shadow-none",
                  on
                    ? "bg-accent-foreground text-accent"
                    : "bg-[rgba(255,255,255,0.58)] text-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    on
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-[rgba(17,17,23,0.25)] bg-transparent",
                  )}
                >
                  {on ? <Check size={14} /> : null}
                </span>
                <span className="flex-1 text-[14px] font-semibold">
                  {t(`extra.${extra.id}`)}
                </span>
                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    on ? "text-accent" : "text-accent-foreground",
                  )}
                >
                  +{formatPrice(extra.price)}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="mt-7 flex items-center justify-between rounded-[24px] bg-[rgba(255,255,255,0.58)] p-4">
          <Typography
            type="h6"
            className="text-[17px] font-extrabold text-accent-foreground"
          >
            {t("pizza.quantity")}
          </Typography>
          <span className="rounded-full bg-accent-foreground px-2 py-1">
            <Stepper value={qty} onChange={setQty} />
          </span>
        </div>
      </div>

      <MobileActionBar
        onPress={add}
        isDisabled={!fromApi || !menuVersion}
        icon={<ShoppingBag size={20} />}
        className="!bg-accent"
        label={
          <span className="flex items-center justify-center gap-2">
            <span>{t("pizza.addToCart")}</span>
            <span className="text-[13px] font-semibold text-muted">
              {formatPrice(total)}
            </span>
          </span>
        }
      />
    </AppFrame>
  );
}
