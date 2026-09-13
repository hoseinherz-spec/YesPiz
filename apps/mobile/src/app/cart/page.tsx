"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";


import { Button, Card, Separator, Typography } from "@heroui/react";
import { ShoppingBag, Trash2 } from "@repo/icons";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";
import { EmptyState } from "@/components/EmptyState";
import { MobileActionBar } from "@/components/MobileActionBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Stepper } from "@/components/Stepper";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { PriceRow } from "@/features/cart/components/PriceRow";
import { PartnerBadge } from "@/features/partner/components/PartnerBadge";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

export default function CartPage() {
  const router = useRouter();
  const { t, language } = useApp();
  const {
    items,
    menuVersion,
    count,
    subtotal,
    discount,
    total,
    deliveryFee,
    updateQty,
    removeItem,
  } = useCart();

  if (items.length === 0) {
    return (
      <AppFrame className="reference-screen">
        <ScreenHeader title={t("cart.title")} backHref="/home/" />
        <EmptyState
          icon={<ShoppingBag size={28} />}
          image="/images/pizza-margherita.png"
          title={t("cart.empty")}
          body={t("cart.emptyBody")}
          actionLabel={t("common.browseMenu")}
          actionHref="/menu/"
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame padded={false} className="!pb-32">
      <div className="h-[max(38px,env(safe-area-inset-top))] bg-background" />
      <div className="min-h-[calc(100dvh-38px)] flex-1 rounded-t-[44px] bg-surface px-[clamp(20px,8vw,38px)] pt-4 pb-10 text-surface-foreground">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-surface-tertiary" />
        <ScreenHeader
          title={t("cart.title")}
          subtitle={`${count} ${count === 1 ? t("common.item") : t("common.items")}`}
          backHref="/home/"
        />

        <div className="mt-5 flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.lineId} className="data-surface rounded-[28px] p-4">
              <Card.Content className="p-0">
                <div className="flex gap-3">
                  <div className="size-[76px] shrink-0 overflow-hidden rounded-[20px] bg-background">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-1"
                      fallbackClassName="[&>svg]:size-12"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <Typography
                          type="h6"
                          className={cn(hx.title, "text-balance leading-snug")}
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          type="body-xs"
                          className={cn(hx.caption, "mt-1 line-clamp-2")}
                        >
                          {item.selectionLabels?.length
                            ? item.selectionLabels.join(" · ")
                            : t(`size.${item.size}`)}
                          {item.extras.length
                            ? ` · ${item.extras.map((extra) => t(`extra.${extra}`)).join(", ")}`
                            : ""}
                        </Typography>
                      </div>
                      <Button
                        isIconOnly
                        variant="ghost"
                        aria-label={`Remove ${item.name}`}
                        onPress={() => removeItem(item.lineId)}
                        className="size-8 min-w-8 rounded-full text-danger"
                      >
                        <Trash2 size={16} color="var(--danger)" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <Typography
                        type="h6"
                        className={cn(hx.title, "tabular-nums")}
                      >
                        <AnimatedNumber currency value={item.unitPrice * item.quantity} />
                      </Typography>
                      <Stepper
                        value={item.quantity}
                        onChange={(next) =>
                          updateQty(item.lineId, next - item.quantity)
                        }
                      />
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          <PartnerBadge />
        </div>

        <Card className="data-surface mt-5 rounded-[28px] p-5">
          <Card.Content className="p-0">
            <PriceRow
              label={t("common.subtotal")}
              value={<AnimatedNumber currency value={subtotal} />}
            />
            {discount > 0 ? (
              <PriceRow
                label={t("common.discount")}
                value={<AnimatedNumber currency value={-discount} />}
                accent
              />
            ) : null}
            <PriceRow
              label={t("common.delivery")}
              value={<AnimatedNumber currency value={deliveryFee} />}
            />
            <Separator className="my-4 bg-border" />
            <PriceRow
              label={t("common.total")}
              value={<AnimatedNumber currency value={total} />}
              bold
            />
          </Card.Content>
        </Card>
      </div>

      {menuVersion === 0 && <AppText as="p" role="status" className="mt-4 text-sm text-muted">{language === "de" ? "Dein Warenkorb ist gespeichert. Öffne die aktuelle Karte, sobald du wieder online bist, um Preise zu bestätigen und zu bestellen." : "Your cart is saved. Open the live menu when connected to confirm prices and checkout."}</AppText>}
      <MobileActionBar
        isDisabled={menuVersion === 0}
        onPress={() => router.push("/checkout/")}
        icon={<ShoppingBag size={20} />}
        label={
          <span className="flex items-center justify-center gap-2">
            <AppText as="span">{t("cart.checkout")}</AppText>
            <AppText as="span" className="text-[13px] font-semibold text-muted">
              <AnimatedNumber currency value={total} />
            </AppText>
          </span>
        }
      />
    </AppFrame>
  );
}
