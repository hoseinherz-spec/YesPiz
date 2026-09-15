"use client";
import { useEffect, useState } from "react";
import type { PizzaSelection } from "@repo/api";
export type UsualPizza = {
  id: string;
  pizzaId: string;
  name: string;
  size: "small" | "medium" | "large";
  extras: string[];
  variantId?: string;
  secondHalfPizzaId?: string;
  selections: PizzaSelection[];
  label: string;
};
const KEY = "yespizz_usual_pizzas_v1";
export function readUsualPizzas(): UsualPizza[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (p): p is UsualPizza =>
          !!p &&
          typeof p.id === "string" &&
          typeof p.pizzaId === "string" &&
          typeof p.name === "string" &&
          typeof p.label === "string" &&
          ["small", "medium", "large"].includes(p.size) &&
          Array.isArray(p.extras) &&
          p.extras.every((x: unknown) => typeof x === "string") &&
          Array.isArray(p.selections) &&
          p.selections.every(
            (x: { groupId?: unknown; optionIds?: unknown }) =>
              typeof x?.groupId === "string" &&
              Array.isArray(x.optionIds) &&
              x.optionIds.every((v: unknown) => typeof v === "string"),
          ),
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}
export function saveUsualPizza(pizza: Omit<UsualPizza, "id">) {
  const id = JSON.stringify([
    pizza.pizzaId,
    pizza.size,
    pizza.extras.slice().sort(),
    pizza.variantId,
    pizza.secondHalfPizzaId,
    pizza.selections,
  ]);
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        [
          { ...pizza, id },
          ...readUsualPizzas().filter((p) => p.id !== id),
        ].slice(0, 20),
      ),
    );
    window.dispatchEvent(new Event(KEY));
    return true;
  } catch {
    return false;
  }
}
export function useUsualPizzas() {
  const [items, setItems] = useState<UsualPizza[]>([]);
  useEffect(() => {
    const update = () => setItems(readUsualPizzas());
    const timer = setTimeout(update, 0);
    window.addEventListener(KEY, update);
    window.addEventListener("storage", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(KEY, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const remove = (id: string) => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(readUsualPizzas().filter((p) => p.id !== id)),
      );
      window.dispatchEvent(new Event(KEY));
    } catch {
      /* Keep the previous saved state when storage is unavailable. */
    }
  };
  return { items, remove };
}
