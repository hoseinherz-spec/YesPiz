"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, Button, Skeleton } from "@heroui/react";
import { resolvePizzaCutout } from "@/constants/media";
import { AppFrame } from "@/components/AppFrame";
import { ScrollHeader } from "@/components/ScrollHeader";
import { useMenuCatalog } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { formatPrice, resolveProductImage } from "@/constants/pizzas";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { ChevronLeft, ShoppingBag } from "@/components/animated-icon/icons";
import styles from "./combos.module.css";

export default function BundlesPage() {
  return (
    <Suspense
      fallback={
        <AppFrame withTabs className={styles.page}>
          <Skeleton className="h-96 w-full rounded-[36px]" />
        </AppFrame>
      }
    >
      <ComboBrowser />
    </Suspense>
  );
}

function ComboBrowser() {
  const catalog = useMenuCatalog();
  const cart = useCart();
  const router = useRouter();
  const { language } = useApp();
  const de = language === "de";
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState(0);
  const combos = catalog.items.filter((p) => p.comboComponents?.length);
  const combo =
    combos.find((p) => p.id === (selected ?? params.get("combo"))) ?? combos[0];
  const contents = combo?.comboComponents ?? [];
  const featured = contents[focus] ?? contents[0];
  const photo = (part: typeof featured) => {
    const product = catalog.items.find((p) => p.id === part?.menuItemId);
    return (
      part?.imageUrl ||
      (product
        ? resolveProductImage(product)
        : combo
          ? resolveProductImage(combo)
          : "")
    );
  };
  function add() {
    if (!combo || !catalog.fromApi || catalog.isOffline) return;
    cart.addItem({
      menuItemId: combo.id,
      menuVersion: catalog.menuVersion,
      name: combo.name,
      size: "medium",
      extras: [],
      quantity: 1,
      unitPrice: combo.price,
      image: photo(contents[0]),
      selectionLabels: contents.map(
        (c) => `${c.quantity} × ${c.name} · ${c.sizeName}`,
      ),
    });
    router.push("/cart/");
  }
  return (
    <AppFrame withTabs className={styles.page}>
      <section className={styles.stage}>
      <ScrollHeader className={styles.header}>
          <Link
            href="/home/"
            aria-label={de ? "Zurück" : "Back"}
            className={styles.icon}
          >
            <ChevronLeft size={22} />
          </Link>
          <h1>{de ? "Zeit zum Teilen" : "Better together"}</h1>
          <Link
            href="/cart/"
            aria-label={de ? "Warenkorb" : "Cart"}
            className={styles.icon}
          >
            <ShoppingBag size={23} />
            {cart.count > 0 && (
              <span className={styles.badge}>{cart.count}</span>
            )}
          </Link>
      </ScrollHeader>
        {catalog.isLoading ? (
          <div className={styles.empty} role="status">
            <Skeleton className="mx-auto size-60 rounded-full" />
            <Skeleton className="mx-auto mt-8 h-9 w-48 rounded-xl" />
            <p>{de ? "Combos werden geladen…" : "Loading combos…"}</p>
          </div>
        ) : catalog.isOffline ? (
          <div className={styles.empty}>
            <h2>
              {de ? "Menü nicht erreichbar" : "We couldn’t load the menu"}
            </h2>
            <p>
              {de
                ? "Bitte versuche es erneut."
                : "Try again to see available combos."}
            </p>
            <Button onPress={() => void catalog.refetch()}>
              {de ? "Erneut versuchen" : "Try again"}
            </Button>
          </div>
        ) : !combo ? (
          <div className={styles.empty}>
            <h2>{de ? "Gutes kommt zusammen" : "Good things come together"}</h2>
            <p>
              {de
                ? "Neue Combos sind bald hier. Entdecke inzwischen unser Menü."
                : "New combos will appear here. Explore the menu in the meantime."}
            </p>
            <Link href="/menu/" className={styles.menuLink}>
              {de ? "Zum Menü" : "Explore the menu"}
            </Link>
          </div>
        ) : (
          <>
            {combos.length > 1 && (
              <nav
                className={styles.comboTabs}
                aria-label={de ? "Combo auswählen" : "Choose a combo"}
              >
                {combos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={c.id === combo.id}
                    onClick={() => {
                      setSelected(c.id);
                      setFocus(0);
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </nav>
            )}
            <div className={styles.hero} key={`${combo.id}-${focus}`}>
              <div className={styles.halo} />
              <ProductImage
                src={photo(featured)}
                alt={featured?.name ?? combo.name}
                className={styles.heroImage}
              />
            </div>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>
                {de ? "Deine Combo" : "Your combo"} ·{" "}
                {contents.reduce((n, c) => n + c.quantity, 0)}{" "}
                {de ? "Produkte" : "items"}
              </p>
              <h2>{combo.name}</h2>
              <p className={styles.description}>{combo.description}</p>
              <div className={styles.avatars} role="group" aria-label={de ? "Enthaltene Pizzen" : "Included pizzas"}>
                {contents.map((part, i) => <Avatar key={`${part.menuItemId}-${i}`} title={`${part.quantity} × ${part.name}`}><Avatar.Image src={resolvePizzaCutout(photo(part))} alt={`${part.quantity} × ${part.name}`} /><Avatar.Fallback>{part.name.slice(0, 2)}</Avatar.Fallback></Avatar>)}
              </div>
              <strong className={styles.price}>
                {formatPrice(combo.price)}
              </strong>
              <Button
                className={styles.add}
                onPress={add}
                isDisabled={!catalog.fromApi || catalog.isOffline}
              >
                {de ? "Combo hinzufügen" : "Add combo to cart"}
                <ShoppingBag size={20} />
              </Button>
            </div>
            <div className={styles.selection}>
              <p className={styles.included}>
                {de ? "Alles dabei" : "All included"}
              </p>
              <div
                className={styles.products}
                role="group"
                aria-label={de ? "Enthaltene Produkte" : "Included products"}
              >
                {contents.map((part, i) => (
                  <button
                    type="button"
                    key={`${part.menuItemId}-${i}`}
                    className={styles.product}
                    aria-pressed={i === focus}
                    onClick={() => setFocus(i)}
                  >
                    <ProductImage
                      src={photo(part)}
                      alt=""
                      className={styles.thumb}
                    />
                    <strong>{part.name}</strong>
                    <span>
                      {part.quantity} × {part.name}
                    </span>
                  </button>
                ))}
              </div>
              <div className={styles.detail} aria-live="polite">
                <strong>{featured?.name}</strong>
                <p>
                  {featured?.quantity} × {featured?.name}
                </p>
                <p className={styles.allergens}>
                  {de ? "Allergene: " : "Allergens: "}
                  {(() => {
                    const allergens = catalog.items.find(
                      (p) => p.id === featured?.menuItemId,
                    )?.allergens;
                    return allergens?.length
                      ? allergens.join(", ")
                      : de
                        ? "Bitte vor der Bestellung nachfragen."
                        : "Please ask before ordering.";
                  })()}
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </AppFrame>
  );
}
