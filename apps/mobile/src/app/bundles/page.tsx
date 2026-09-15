"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useMenuCatalog } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { formatPrice, resolveProductImage } from "@/constants/pizzas";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
export default function BundlesPage() {
  const catalog = useMenuCatalog(),
    cart = useCart(),
    router = useRouter();
  const { language } = useApp(),
    de = language === "de";
  const [count, setCount] = useState(2),
    [selected, setSelected] = useState<string[]>([]);
  const pizzas = catalog.items.filter((p) => !p.customization);
  const picks = Array.from(
    { length: count },
    (_, i) =>
      pizzas.find((p) => p.id === selected[i]) ??
      pizzas[i % Math.max(1, pizzas.length)],
  ).filter((p) => !!p);
  const delta = cart.sizes.find((s) => s.id === "medium")?.delta ?? 0;
  const total = picks.reduce((sum, p) => sum + p.price + delta, 0);
  function add() {
    if (picks.length !== count || !catalog.fromApi || catalog.isOffline) return;
    for (const p of picks)
      cart.addItem({
        menuItemId: p.id,
        menuVersion: catalog.menuVersion,
        name: p.name,
        size: "medium",
        extras: [],
        quantity: 1,
        unitPrice: p.price + delta,
        image: resolveProductImage(p),
      });
    router.push("/cart/");
  }
  return (
    <AppFrame withTabs className="reference-screen">
      <ScreenHeader
        title={de ? "Pizza für alle" : "Make a night of it"}
        subtitle={
          de
            ? "Jeder bekommt seine Lieblingspizza."
            : "Everyone gets their favourite."
        }
      />
      <div
        className="my-6 grid grid-cols-2 gap-3"
        role="group"
        aria-label={de ? "Paketgröße" : "Pack size"}
      >
        {[2, 4].map((n) => (
          <button
            type="button"
            key={n}
            aria-pressed={count === n}
            onClick={() => setCount(n)}
            className={`min-h-20 rounded-3xl border border-border p-4 text-left ${count === n ? "bg-accent text-accent-foreground" : "data-surface"}`}
          >
            <strong className="block text-lg">
              {n === 2
                ? de
                  ? "Zu zweit"
                  : "Dinner for two"
                : de
                  ? "Familienabend"
                  : "Family table"}
            </strong>
            <span className="mt-1 block text-xs">
              {n} × {de ? "Medium-Pizza" : "medium pizzas"}
            </span>
          </button>
        ))}
      </div>
      {catalog.isLoading ? (
        <p role="status">{de ? "Menü wird geladen…" : "Loading the menu…"}</p>
      ) : !pizzas.length ? (
        <p className="mt-6 text-muted">
          {de
            ? "Aktuell keine Pakete verfügbar."
            : "No pizza packs are available right now."}
        </p>
      ) : (
        <section className="data-surface rounded-[28px] p-5">
          <h2 className="text-xl font-bold">
            {de ? "Euer perfekter Abend" : "Build your perfect evening"}
          </h2>
          <div className="mt-5 space-y-4">
            {picks.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <ProductImage
                  src={resolveProductImage(p)}
                  alt=""
                  className="size-16 shrink-0 object-contain"
                />
                <label className="min-w-0 flex-1 text-xs font-semibold">
                  Pizza {i + 1} · {formatPrice(p.price + delta)}
                  <select
                    value={p.id}
                    onChange={(e) =>
                      setSelected((prev) => {
                        const next = picks.map((pick, n) => prev[n] ?? pick.id);
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                    className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm"
                  >
                    {pizzas.map((choice) => (
                      <option key={choice.id} value={choice.id}>
                        {choice.name}
                      </option>
                    ))}
                  </select>
                  <small className="mt-2 block text-xs font-normal leading-5 text-muted">
                    {de ? "Allergene: " : "Allergens: "}
                    {p.allergens?.length
                      ? p.allergens.join(", ")
                      : de
                        ? "Nicht angegeben — bitte nachfragen"
                        : "Not supplied — please ask before ordering"}
                  </small>
                </label>
              </div>
            ))}
          </div>
          <p className="my-5 text-xs leading-5 text-muted">
            {de
              ? "Reguläre Menüpreise. Allergene auf den jeweiligen Produktseiten prüfen. Lieferkosten im Checkout."
              : "Regular menu prices. Check each product page for allergens. Delivery is shown at checkout."}
          </p>
          <Button
            className="min-h-12 w-full"
            isDisabled={!catalog.fromApi || catalog.isOffline}
            onPress={add}
          >
            {de ? "Paket hinzufügen" : "Add pizza pack"} · {formatPrice(total)}
          </Button>
          {catalog.isOffline && (
            <Button
              variant="ghost"
              className="mt-2 w-full"
              onPress={() => void catalog.refetch()}
            >
              {de ? "Menü erneut laden" : "Retry live menu"}
            </Button>
          )}
        </section>
      )}
    </AppFrame>
  );
}
