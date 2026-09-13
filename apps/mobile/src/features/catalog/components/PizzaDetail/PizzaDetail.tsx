"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";

import { FormScope, RadioField, CheckboxGroupField } from "@repo/ui/forms";

import type { PizzaSelection } from "@repo/api";
import { PizzaChoices } from "./PizzaChoices";
import { Typography, buttonVariants } from "@heroui/react";
import { ArrowLeft, Heart, ShoppingBag, Truck } from "@repo/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
import { PizzaComments } from "./PizzaComments";
import type { PizzaDetailProps } from "./PizzaDetail.types";

export function PizzaDetail({ id }: PizzaDetailProps) {
  const router = useRouter();
  const [adding, startAdding] = useTransition();
  const { t, language, isFavorite, toggleFavorite } = useApp();
  const { addItem, count, sizes, extraOptions, baseDeliveryFee } = useCart();
  const { getById, menuVersion, fromApi, isLoading, isOffline } =
    useMenuCatalog();
  const pizza = getById(id);

  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [extras, setExtras] = useState<string[]>([]);
  const [chosenVariant, setChosenVariant] = useState("");
  const [selections, setSelections] = useState<PizzaSelection[]>([]);
  const variantId =
    chosenVariant ||
    pizza?.customization?.variants.find((v) => v.isActive)?.id ||
    "";
  const variant = pizza?.customization?.variants.find(
    (v) => v.id === variantId && v.isActive,
  );
  const choicesValid =
    !pizza?.customization ||
    (!!variant &&
      pizza.customization.groups.every((g) => {
        const selected =
          selections.find((s) => s.groupId === g.id)?.optionIds ?? [];
        return (
          selected.length >= g.min &&
          selected.length <= g.max &&
          selected.every((id) =>
            g.options.some(
              (o) =>
                o.id === id &&
                o.isActive &&
                (!o.variantIds.length || o.variantIds.includes(variantId)),
            ),
          )
        );
      }));
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const unit = useMemo(
    () =>
      pizza?.customization
        ? ((variant?.priceCents ?? 0) +
            pizza.customization.groups.reduce(
              (sum, g) =>
                sum +
                g.options
                  .filter((o) =>
                    selections
                      .find((s) => s.groupId === g.id)
                      ?.optionIds.includes(o.id),
                  )
                  .reduce(
                    (n, o) =>
                      n +
                      (o.priceOverrides?.find((p) => p.variantId === variantId)
                        ?.priceCents ?? o.priceCents),
                    0,
                  ),
              0,
            )) /
          100
        : pizza
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
    [pizza, size, extras, sizes, extraOptions, variant, selections, variantId],
  );
  const total = unit * qty;

  if (isLoading && !pizza) {
    return (
      <FormScope>
        <AppFrame padded={false}>
          <div
            className="h-dvh animate-pulse bg-card"
            aria-label="Loading pizza details"
          />
        </AppFrame>
      </FormScope>
    );
  }

  if (!pizza) {
    return (
      <FormScope>
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
      </FormScope>
    );
  }

  const fav = isFavorite(pizza.pizzaId ?? pizza.id);
  const image = resolveProductImage(pizza);

  const add = () => {
    addItem({
      menuItemId: pizza.id,
      variantId: pizza.customization ? variantId : undefined,
      selections: pizza.customization
        ? [...selections]
            .sort((a, b) => a.groupId.localeCompare(b.groupId))
            .map((s) => ({ ...s, optionIds: [...s.optionIds].sort() }))
        : undefined,
      selectionLabels: pizza.customization
        ? [
            variant?.name ?? "",
            ...pizza.customization.groups.flatMap((g) =>
              g.options
                .filter((o) =>
                  selections
                    .find((s) => s.groupId === g.id)
                    ?.optionIds.includes(o.id),
                )
                .map((o) => `${g.name}: ${o.name}`),
            ),
          ]
        : undefined,
      menuVersion: fromApi ? menuVersion : 0,
      name: pizza.name,
      size,
      extras,
      quantity: qty,
      unitPrice: unit,
      image,
    });
    startAdding(() => router.push("/cart/"));
  };

  return (
    <FormScope>
      <AppFrame padded={false} className="!pb-32">
        <section className="relative isolate h-[min(52dvh,480px)] min-h-[320px] overflow-hidden bg-accent/15" aria-label={pizza.name}>
          <ProductImage src={selectedImage ?? image} alt={pizza.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_25%,transparent),transparent_35%,var(--background)_100%)]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(24px,env(safe-area-inset-top))]">
            <IconBadgeButton aria-label="Back" onPress={() => router.back()} className="bg-surface text-foreground shadow-sm"><ArrowLeft size={20} /></IconBadgeButton>
            <div className="flex gap-2">
              <IconBadgeButton aria-label={fav ? `Remove ${pizza.name} from saved` : `Save ${pizza.name}`} onPress={() => toggleFavorite(pizza.pizzaId ?? pizza.id)} className="bg-surface text-foreground shadow-sm">
                <Heart size={18} fill={fav ? "var(--danger)" : "transparent"} color={fav ? "var(--danger)" : "var(--foreground)"} />
              </IconBadgeButton>
              <IconBadgeButton href="/cart/" aria-label="Cart" badge={count} className="bg-surface text-foreground shadow-sm"><ShoppingBag size={18} /></IconBadgeButton>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-6 pb-14">
            <div className="min-w-0">
              <Typography type="h1" className="text-[clamp(32px,9vw,44px)] leading-[1.08] font-extrabold tracking-tight text-foreground">{pizza.name}</Typography>
              <Typography type="body-sm" className="mt-3 text-foreground/80">{pizzaTagline(pizza, language)}</Typography>
            </div>
            {!!pizza.presentation?.gallery.length && <div className="flex max-h-64 shrink-0 flex-col gap-2 overflow-y-auto">
              {[...new Set([image, ...pizza.presentation.gallery])].map((src, index) => <button key={src} type="button" aria-label={`View ${pizza.name} photo ${index + 1}`} aria-pressed={(selectedImage ?? image) === src} onClick={() => setSelectedImage(src)} className={cn("size-16 overflow-hidden rounded-2xl border-2 focus-visible:outline-2 focus-visible:outline-accent", (selectedImage ?? image) === src ? "border-accent" : "border-border")}><ProductImage src={src} alt="" className="size-full object-cover" /></button>)}
            </div>}
          </div>
        </section>
        <div className="relative z-10 -mt-7 flex-1 rounded-t-[32px] bg-surface px-6 pt-7 pb-10 text-foreground">
          <div className="grid grid-cols-3 gap-3 border-b border-border pb-6 text-center">
            <div><Typography type="body-xs" className="text-muted">{language === "de" ? "Preis" : "Price"}</Typography><AppText as="span" className="mt-2 block font-bold text-foreground"><AnimatedNumber currency value={unit} /></AppText></div>
            <div><Typography type="body-xs" className="text-muted">{t("common.delivery")}</Typography><AppText as="span" className="mt-2 flex items-center justify-center gap-1 font-bold text-foreground"><Truck size={14} /><AnimatedNumber currency value={baseDeliveryFee} /></AppText></div>
            <div><Typography type="body-xs" className="text-muted">{t("pizza.quantity")}</Typography><AppText as="span" className="mt-2 block font-bold text-foreground"><AnimatedNumber value={qty} /></AppText></div>
          </div>
          {isOffline && <Typography type="body-xs" className="mt-4 text-muted">{language === "de" ? "Gespeicherte Karte. Preise werden vor der Zahlung geprüft." : "Saved menu. Prices will be checked before payment."}</Typography>}
          <Typography type="h2" className="mt-6 text-xl font-bold">{language === "de" ? "Über diese Pizza" : "About this pizza"}</Typography>
          {!!pizza.presentation?.fields.length && (
            <dl className="mt-4 grid gap-2">
              {pizza.presentation.fields.map((f, index) => (
                <div key={index} className="flex justify-between gap-4 text-sm">
                  <dt className="font-semibold">{f.name}</dt>
                  <dd>
                    {f.type === "boolean"
                      ? f.value === "true"
                        ? "Yes"
                        : "No"
                      : f.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <Typography
            type="body"
            className="mt-4 text-[14px] leading-6 text-muted"
          >
            {pizzaDescription(pizza, language)}
          </Typography>
          <div className="mt-5 rounded-2xl border border-current/15 p-4 text-sm">
            <AppText as="h2" className="font-bold">
              {language === "de" ? "Allergene" : "Allergens"}
            </AppText>
            <AppText as="p" className="mt-2">
              {pizza.allergens?.length
                ? pizza.allergens.join(", ")
                : language === "de"
                  ? "Angaben noch nicht verfügbar. Kontaktiere Yespizz vor der Bestellung, wenn du Allergien hast."
                  : "Details are not available yet. Contact Yespizz before ordering if you have food allergies."}
            </AppText>
          </div>

          <Typography
            type="h6"
            className="mt-7 mb-3 text-[18px] font-extrabold text-foreground"
          >
            {t("pizza.ingredients")}
          </Typography>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {pizzaIngredients(pizza, language).map((ingredient, index) => (
              <div key={ingredient} className="w-[78px] shrink-0 text-center">
                <AppText
                  as="span"
                  className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-secondary text-[24px] shadow-sm"
                >
                  {["🍅", "🧀", "🌿", "🫒", "🌶️"][index % 5]}
                </AppText>
                <AppText
                  as="span"
                  className="mt-2 block line-clamp-2 text-[11px] font-bold text-foreground"
                >
                  {ingredient}
                </AppText>
              </div>
            ))}
          </div>

          {pizza.customization ? (
            <PizzaChoices
              config={pizza.customization}
              variantId={variantId}
              selections={selections}
              onChange={(id, values) => {
                setChosenVariant(id);
                setSelections(values);
              }}
            />
          ) : (
            <>
              <RadioField
                name="size"
                label={t("pizza.chooseSize")}
                required
                value={size}
                onChange={(v) => setSize(v as typeof size)}
                options={sizes.map((s) => ({
                  id: s.id,
                  label: `${t(`size.${s.id}`)} · ${s.delta === 0 ? t("pizza.base") : `${s.delta > 0 ? "+" : ""}€${s.delta}`}`,
                }))}
              />
              <CheckboxGroupField
                name="extras"
                label={t("pizza.addExtras")}
                value={extras}
                onChange={setExtras}
                options={extraOptions.map((extra) => ({
                  id: extra.id,
                  label: `${t(`extra.${extra.id}`)} +${formatPrice(extra.price)}`,
                }))}
              />
            </>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-surface-secondary p-4">
            <Typography
              type="h6"
              className="text-[17px] font-extrabold text-foreground"
            >
              {t("pizza.quantity")}
            </Typography>
            <span className="inline-flex">
              <Stepper value={qty} onChange={setQty} max={99} />
            </span>
          </div>
        </div>

        {fromApi && <PizzaComments id={pizza.id} language={language} />}

        <MobileActionBar
          expandingArrow
          isPending={adding}
          onPress={add}
          isDisabled={!choicesValid}
          icon={<ShoppingBag size={20} />}
          className="!bg-surface"
          label={
            <span className="flex items-center justify-center gap-2">
              <AppText as="span">{t("pizza.addToCart")}</AppText>
              <AppText
                as="span"
                className="text-[13px] font-semibold text-muted"
              >
                <AnimatedNumber currency value={total} />
              </AppText>
            </span>
          }
        />
      </AppFrame>
    </FormScope>
  );
}
