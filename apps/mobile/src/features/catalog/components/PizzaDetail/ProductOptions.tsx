"use client";
import { useId } from "react";
import type { PizzaCustomization, PizzaSelection } from "@repo/api";
import styles from "./ProductOptions.module.css";

type Size = { id: string; label: string; price: number };
export function ProductOptions({
  sizes,
  sizeId,
  onSize,
  config,
  selections,
  onSelections,
  language,
  disabled,
  hideSizes = false,
}: {
  sizes: Size[];
  sizeId: string;
  onSize: (id: string) => void;
  config?: PizzaCustomization;
  selections: PizzaSelection[];
  onSelections: (value: PizzaSelection[]) => void;
  language: string;
  disabled: boolean;
  hideSizes?: boolean;
}) {
  const prefix = useId();
  const de = language === "de";
  if (hideSizes && !config?.groups.length) return null;
  const money = (value: number) =>
    new Intl.NumberFormat(de ? "de-AT" : "en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  return (
    <section
      className={styles.options}
      aria-label={de ? "Produkt anpassen" : "Customize your product"}
    >
      <div className={styles.intro}>
        <h2>{de ? "Ganz nach deinem Geschmack" : "Make it yours"}</h2>
        <p>
          {de
            ? "Wähle deine Lieblingskombination."
            : "Choose your favourite combination."}
        </p>
      </div>
      {!hideSizes && <fieldset disabled={disabled} className={styles.group}>
        <legend>{de ? "Größe" : "Size"}</legend>
        <div className={styles.row}>
          {sizes.map((size) => (
            <label className={styles.pill} key={size.id}>
              <input
                type="radio"
                name={`${prefix}-size`}
                checked={size.id === sizeId}
                onChange={() => onSize(size.id)}
              />
              <span>
                {size.label}
                <small>{money(size.price)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>}
      {config?.groups.map((group) => {
        const selected =
          selections.find((s) => s.groupId === group.id)?.optionIds ?? [];
        const available = group.options.filter(
          (o) =>
            o.isActive &&
            (!o.variantIds.length || o.variantIds.includes(sizeId)),
        );
        if (!available.length && group.min === 0) return null;
        const hint =
          group.max === 1
            ? group.min
              ? de
                ? "Wähle eine Option"
                : "Choose one"
              : de
                ? "Optional · eine Option"
                : "Optional · choose one"
            : de
              ? `Wähle ${group.min ? `${group.min}–` : "bis zu "}${group.max}`
              : `${group.min ? `Choose ${group.min}–` : "Choose up to "}${group.max}`;
        return (
          <fieldset key={group.id} disabled={disabled} className={styles.group}>
            <legend>{group.name}</legend>
            <p className={styles.hint} id={`${prefix}-${group.id}-hint`}>
              {hint}
            </p>
            <div className={styles.row}>
              {available.map((option) => {
                const checked = selected.includes(option.id);
                const price =
                  (option.priceOverrides?.find((p) => p.variantId === sizeId)
                    ?.priceCents ?? option.priceCents) / 100;
                return (
                  <label key={option.id} className={styles.pill}>
                    <input
                      type={group.max === 1 ? "radio" : "checkbox"}
                      name={`${prefix}-${group.id}`}
                      checked={checked}
                      aria-describedby={`${prefix}-${group.id}-hint`}
                      disabled={
                        !checked &&
                        group.max > 1 &&
                        selected.length >= group.max
                      }
                      onChange={() => {
                        const optionIds =
                          group.max === 1
                            ? [option.id]
                            : checked
                              ? selected.filter((id) => id !== option.id)
                              : [...selected, option.id];
                        onSelections([
                          ...selections.filter((s) => s.groupId !== group.id),
                          { groupId: group.id, optionIds },
                        ]);
                      }}
                    />
                    <span>
                      {option.name}
                      {price > 0 && <small>+{money(price)}</small>}
                    </span>
                  </label>
                );
              })}
            </div>
            {group.min === 0 && selected.length > 0 && (
              <button
                type="button"
                className={styles.clear}
                onClick={() =>
                  onSelections(selections.filter((s) => s.groupId !== group.id))
                }
              >
                {de ? "Auswahl zurücksetzen" : "Clear selection"}
              </button>
            )}
          </fieldset>
        );
      })}
    </section>
  );
}
