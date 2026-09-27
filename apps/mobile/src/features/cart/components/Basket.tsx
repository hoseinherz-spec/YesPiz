"use client";

import { ViewTransition, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button, Drawer } from "@heroui/react";
import { usePublishedMenuQuery } from "@repo/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  ShoppingBag,
} from "@/components/animated-icon/icons";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { AppFrame } from "@/components/AppFrame";
import { ScrollHeader } from "@/components/ScrollHeader";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { pizzaCraftAsset } from "@/constants/media";
import { ToppingImage } from "@/features/catalog/components/PizzaDetail/ToppingStudio";
import styles from "./Basket.module.css";

function SlideToCheckout({ disabled }: { disabled: boolean }) {
  const { language } = useApp();
  const router = useRouter();
  return (
    <SlideToConfirm disabled={disabled} label={language === "de" ? "Zum Bestellen schieben" : "Slide to order"} confirmedLabel={language === "de" ? "Weiter zur Kasse" : "Ready to checkout"} onConfirm={() => router.push("/checkout/")} />
  );
}

export function BasketContents({ onClose }: { onClose?: () => void }) {
  const { t, language } = useApp();
  const {
    items,
    count,
    subtotal,
    total,
    deliveryFee,
    discount,
    menuVersion,
    updateQty,
    removeItem,
  } = useCart();
  const menu = usePublishedMenuQuery();
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Commit the hidden state before revealing each piece; CSS owns all timing.
    if (panel.current) void panel.current.offsetHeight;
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const unavailable = items.filter(
    (item) =>
      menu.data &&
      (item.menuVersion !== menu.data.version?.version ||
        !menu.data.items.some((pizza) => pizza.id === item.menuItemId) ||
        (item.secondHalfItemId &&
          !menu.data.items.some(
            (pizza) => pizza.id === item.secondHalfItemId,
          ))),
  );
  const disabled =
    !count ||
    !menuVersion ||
    menu.isPending ||
    menu.isError ||
    unavailable.length > 0;
  const reveal = (index: number) =>
    ({ "--basket-index": Math.min(index, 7) }) as CSSProperties;
  return (
    <div ref={panel} className={styles.panel}>
      {onClose ? (
        <button
          className={styles.handle}
          aria-label={
            language === "de" ? "Warenkorb schließen" : "Close basket"
          }
          onClick={onClose}
        >
          <span />
        </button>
      ) : (
        <div className={styles.handle} aria-hidden="true">
          <span />
        </div>
      )}
      {unavailable.length > 0 && (
        <div role="alert" className={styles.notice}>
          <p>{t("cart.menuChanged")}</p>
          <button
            onClick={() =>
              unavailable.forEach((item) => removeItem(item.lineId))
            }
          >
            {t("cart.removeUnavailable")}
          </button>
          <Link href="/menu/">{t("common.browseMenu")}</Link>
        </div>
      )}
      {(menu.isError || !menuVersion) && count > 0 && (
        <div role="status" className={styles.notice}>
          <p>{t("cart.offlineRecovery")}</p>
          <button onClick={() => void menu.refetch()}>
            {t("payment.retryQuote")}
          </button>
          <Link href="/menu/">{t("common.browseMenu")}</Link>
        </div>
      )}
      {count === 0 ? (
        <div className={styles.empty}>
          <ProductImage
            src={pizzaCraftAsset("Pizza Box")}
            alt=""
            className={styles.emptyArtwork}
          />
          <h2>{t("cart.empty")}</h2>
          <p>{t("cart.emptyBody")}</p>
          {onClose ? (
            <button onClick={onClose}>{t("common.browseMenu")}</button>
          ) : (
            <Link href="/menu/">{t("common.browseMenu")}</Link>
          )}
        </div>
      ) : (
        <>
          <ul className={styles.items} aria-label={t("cart.title")}>
            {items.map((item, index) => {
              const menuItem = menu.data?.items.find((pizza) => pizza.id === item.menuItemId);
              const toppingOptions = (item.ingredientChanges ?? []).flatMap((change) => {
                const option = menuItem?.ingredientOptions?.find((candidate) => candidate.ingredientId === change.ingredientId);
                return option ? [option] : [];
              });
              return (
              <li
                key={item.lineId}
                className="t-panel-slide"
                data-open={shown}
                style={reveal(index)}
              >
                <article className={styles.row}>
                  <div className={styles.disc}>
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className={styles.pizza}
                    />
                  </div>
                  <div className={styles.itemInfo}>
                    <h2>{item.name}</h2>
                    <p className={styles.options}>
                      {item.selectionLabels?.length
                        ? item.selectionLabels.join(" · ")
                        : t(`size.${item.size}`)}
                      {item.extras.length
                        ? ` · ${item.extras.map((extra) => t(`extra.${extra}`)).join(", ")}`
                        : ""}
                    </p>
                    {toppingOptions.length > 0 && (
                      <div className={styles.toppingAvatars} aria-label={`${toppingOptions.length} topping changes`}>
                        {toppingOptions.slice(0, 5).map((option) => (
                          <span key={option.ingredientId} title={option.name}>
                            <ToppingImage option={option} />
                          </span>
                        ))}
                        {toppingOptions.length > 5 && <small>+{toppingOptions.length - 5}</small>}
                      </div>
                    )}
                    {unavailable.includes(item) && (
                      <p className={styles.unavailable}>
                        {t("cart.unavailable")}
                      </p>
                    )}
                    <div
                      className={styles.quantity}
                      role="group"
                      aria-label={`${item.name} quantity`}
                    >
                      <Button isIconOnly variant="ghost" className="rounded-full"
                        aria-label={
                          item.quantity === 1
                            ? `Remove ${item.name}`
                            : `Decrease ${item.name}`
                        }
                        onPress={() => updateQty(item.lineId, -1)}
                      >
                        <span aria-hidden="true">−</span>
                      </Button>
                      <span aria-live="polite">
                        {String(item.quantity).padStart(2, "0")}
                      </span>
                      <Button isIconOnly variant="ghost" className="rounded-full"
                        aria-label={`Increase ${item.name}`}
                        isDisabled={item.quantity >= 99}
                        onPress={() => updateQty(item.lineId, 1)}
                      >
                        <Plus size={17} />
                      </Button>
                    </div>
                  </div>
                  <strong className={styles.price}>
                    <AnimatedNumber
                      currency
                      value={item.unitPrice * item.quantity}
                    />
                  </strong>
                </article>
              </li>
              );
            })}
          </ul>
          <div
            className="t-panel-slide"
            data-open={shown}
            style={reveal(items.length)}
          >
            <section
              className={styles.totalCard}
              aria-label={t("common.total")}
            >
              <span className={styles.itemCount}>
                {count} {t(count === 1 ? "common.item" : "common.items")}
              </span>
              <ProductImage
                src={items[0]?.image || "/images/hero-pizza.png"}
                alt=""
                className={styles.heroPizza}
              />
              <div className={styles.totalNumber}>
                <span>{t("common.total")}</span>
                <strong>
                  <AnimatedNumber currency value={total} />
                </strong>
              </div>
            </section>
            <details className={styles.breakdown}>
              <summary>
                {language === "de" ? "Preisübersicht" : "Price breakdown"}
              </summary>
              <dl>
                <div>
                  <dt>{t("common.subtotal")}</dt>
                  <dd>
                    <AnimatedNumber currency value={subtotal} />
                  </dd>
                </div>
                {deliveryFee > 0 && (<div>
                  <dt>{t("common.delivery")}</dt>
                  <dd>
                    <AnimatedNumber currency value={deliveryFee} />
                  </dd>
                </div>)}
                {discount > 0 && (
                  <div>
                    <dt>{t("common.discount")}</dt>
                    <dd>
                      <AnimatedNumber currency value={-discount} />
                    </dd>
                  </div>
                )}
              </dl>
            </details>
          </div>
          <div
            className={`t-panel-slide ${styles.sliderWrap}`}
            data-open={shown}
            style={reveal(items.length + 1)}
          >
            <SlideToCheckout disabled={disabled} />
          </div>
        </>
      )}
    </div>
  );
}

export function BasketSheet() {
  const { count, total, items } = useCart();
  const { language, t } = useApp();
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <>
      <ViewTransition name="basket-peek" enter="basket-overlay" exit="basket-overlay" share="basket-overlay" default="none">
      <button
        className={styles.peek}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t("cart.title")}, ${count} ${t("common.items")}`}
      >
        <span className={styles.peekNotch} aria-hidden="true">
          <span />
        </span>
        <span className={styles.peekPizza}>
          {items[0] ? (
            <ProductImage
              src={items[0].image}
              alt=""
              className={styles.pizza}
            />
          ) : (
            <ShoppingBag size={28} />
          )}
        </span>
        <span className={styles.peekCount}>
          <span>{t("cart.title")}</span>
          <strong>
            {count} {t(count === 1 ? "common.item" : "common.items")}
          </strong>
        </span>
        <span className={styles.peekTotal}>
          <span>{t("common.total")}</span>
          <strong>
            <AnimatedNumber currency value={total} />
          </strong>
        </span>
      </button>
      </ViewTransition>
      <Drawer isOpen={open} onOpenChange={setOpen}>
        <Drawer.Backdrop className={styles.backdrop}>
          <Drawer.Content placement="bottom" className={styles.sheet}>
            <Drawer.Dialog className={styles.dialog}>
              <Drawer.Heading className="sr-only">
                {language === "de" ? "Dein Warenkorb" : "Your cart"}
              </Drawer.Heading>
              <BasketContents onClose={() => setOpen(false)} />
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </>
  );
}

export function BasketPage() {
  const { language } = useApp();
  return (
    <AppFrame padded={false} className={styles.page}>
      <ScrollHeader className={styles.header}>
        <h1>
          {language === "de" ? "Dein" : "Your"}
          <strong>{language === "de" ? "Warenkorb" : "Cart"}</strong>
        </h1>
        <IconBadgeButton href="/menu/" aria-label="Back to menu" className={styles.backButton}>
          <ChevronLeft size={26} />
        </IconBadgeButton>
      </ScrollHeader>
      <BasketContents />
    </AppFrame>
  );
}
