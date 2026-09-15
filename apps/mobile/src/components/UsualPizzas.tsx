"use client";
import Link from "next/link";
import { ArrowRight, Trash1 as Trash } from "@repo/icons";
import { useUsualPizzas } from "@/lib/usual-pizzas";
import { useMenuCatalog } from "@/lib/catalog";
import { useApp } from "@/context/AppContext";
export function UsualPizzas({ editable = false }: { editable?: boolean }) {
  const { items, remove } = useUsualPizzas();
  const catalog = useMenuCatalog();
  const { language } = useApp();
  const de = language === "de";
  if (!items.length) return null;
  return (
    <section className="my-6">
      <h2 className="text-xl font-bold">{de ? "Wie immer?" : "Your usual?"}</h2>
      <p className="mt-1 text-xs text-muted">
        {de
          ? "Deine Kombinationen auf diesem Gerät. Preis wird neu geprüft."
          : "Your combinations on this device. Today’s price is checked before adding."}
      </p>
      <div className="mt-4 space-y-3">
        {items.slice(0, editable ? 20 : 2).map((item) => {
          const pizza = catalog.items.find(
            (p) => (p.pizzaId ?? p.id) === item.pizzaId,
          );
          const secondAvailable =
            !item.secondHalfPizzaId ||
            catalog.items.some(
              (p) => (p.pizzaId ?? p.id) === item.secondHalfPizzaId,
            );
          return (
            <article
              key={item.id}
              className="data-surface flex items-center gap-3 rounded-2xl p-4"
            >
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{item.name}</strong>
                <span className="mt-1 block text-xs text-muted">
                  {item.label}
                </span>
                {pizza && secondAvailable ? (
                  <Link
                    className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
                    href={`/pizza/?id=${encodeURIComponent(pizza.id)}&usual=${encodeURIComponent(item.id)}`}
                  >
                    {de ? "Auswahl prüfen" : "Review & add"}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <p className="mt-2 text-xs text-warning">
                    {de ? "Momentan nicht verfügbar" : "Currently unavailable"}
                  </p>
                )}
              </div>
              {editable && (
                <button
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
                  aria-label={`${de ? "Entfernen" : "Remove"} ${item.name}`}
                  onClick={() => remove(item.id)}
                >
                  <Trash size={16} />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
