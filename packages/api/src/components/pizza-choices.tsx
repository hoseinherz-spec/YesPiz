"use client";
import { Button } from "@heroui/react";
import { CheckboxGroupField, Fieldset, RadioField } from "@repo/ui/forms";
import type { PizzaCustomization, PizzaSelection } from "../domains/catalog";

export function PizzaChoices({
  config,
  variantId,
  selections,
  onChange,
}: {
  config: PizzaCustomization;
  variantId: string;
  selections: PizzaSelection[];
  onChange: (variantId: string, selections: PizzaSelection[]) => void;
}) {
  return (
    <div className="mt-7 grid gap-5">
      <RadioField
        name="pizza-variant"
        label="Choose your pizza size or style"
        required
        value={variantId}
        onChange={(id) => onChange(id, [])}
        options={config.variants.map((v) => ({
          id: v.id,
          disabled: !v.isActive,
          label: `${v.name} · €${(v.priceCents / 100).toFixed(2)}${v.isActive ? "" : " · Unavailable"}`,
        }))}
      />
      {config.groups.map((g) => {
        const selected =
          selections.find((s) => s.groupId === g.id)?.optionIds ?? [];
        const options = g.options
          .filter(
            (o) => !o.variantIds.length || o.variantIds.includes(variantId),
          )
          .map((o) => ({
            id: o.id,
            disabled: !o.isActive,
            label: `${o.name}${o.isActive ? "" : " · Unavailable"} +€${((o.priceOverrides?.find((p) => p.variantId === variantId)?.priceCents ?? o.priceCents) / 100).toFixed(2)}`,
          }));
        const change = (optionIds: string[]) =>
          onChange(variantId, [
            ...selections.filter((s) => s.groupId !== g.id),
            { groupId: g.id, optionIds },
          ]);
        return (
          <Fieldset key={g.id}>
            <p className="mb-2 text-sm opacity-70">
              {g.min
                ? `Required · choose ${g.min}–${g.max}`
                : `Optional · up to ${g.max}`}
            </p>
            {g.max === 1 ? (
              <RadioField
                name={`group-${g.id}`}
                label={g.name || "Untitled choice group"}
                required={g.min > 0}
                value={selected[0] ?? ""}
                onChange={(v) => change(v ? [v] : [])}
                options={options}
              />
            ) : (
              <CheckboxGroupField
                name={`group-${g.id}`}
                label={g.name || "Untitled choice group"}
                min={g.min}
                max={g.max}
                value={selected}
                onChange={change}
                options={options}
              />
            )}
            {g.min === 0 && selected.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="mt-2 text-sm underline"
                onPress={() => change([])}
              >
                Clear {g.name}
              </Button>
            )}
          </Fieldset>
        );
      })}
    </div>
  );
}
