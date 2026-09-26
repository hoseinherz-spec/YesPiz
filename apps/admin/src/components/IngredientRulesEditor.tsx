"use client";
import { DataList } from "@/components/AdminTable";
import type { Ingredient, IngredientOptionConfig } from "@repo/api";
import { Input, FormValue, z } from "@/components/AdminForms";
export function IngredientRulesEditor({
  library,
  selected,
  options,
  onSelected,
  onOptions,
  disabled = false,
}: {
  library: Ingredient[];
  selected: string[];
  options: IngredientOptionConfig[];
  onSelected: (ids: string[]) => void;
  onOptions: (options: IngredientOptionConfig[]) => void;
  disabled?: boolean;
}) {
  const update = (id: string, patch: Partial<IngredientOptionConfig>) =>
    onOptions(
      options.map((o) => (o.ingredientId === id ? { ...o, ...patch } : o)),
    );
  return (
    <fieldset disabled={disabled} className="mt-4 min-w-0">
      <legend className="font-medium">Ingredients & customer choices</legend>
      <p className="mt-1 text-xs text-muted">
        Included ingredients can be removed. Optional ingredients can be added
        for the price below. Removing an included ingredient does not change the
        price.
      </p>
      <FormValue
        name="ingredientOptions"
        value={options}
        schema={z
          .array(
            z.object({
              ingredientId: z.string().min(1),
              priceCents: z.number().int().min(0).max(100000),
              portionGrams: z.number().min(0.1).max(1000),
            }),
          )
          .max(40)}
      />
      <div className="mt-3 grid gap-2">
        {
          <DataList
            data={library}
            label="available ingredients"
            renderItem={(ingredient) => {
              const base = selected.includes(ingredient.id);
              const rule = options.find(
                (o) => o.ingredientId === ingredient.id,
              );
              return (
                <div
                  key={ingredient.id}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <span className="min-w-28 flex-1 font-medium">
                      {ingredient.name}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <Input
                        type="checkbox"
                        aria-label={`${ingredient.name}: included in pizza`}
                        label="Included in pizza"
                        checked={base}
                        disabled={!base && selected.length >= 40}
                        onChange={(e) =>
                          onSelected(
                            e.target.checked
                              ? [...selected, ingredient.id]
                              : selected.filter((id) => id !== ingredient.id),
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Input
                        type="checkbox"
                        aria-label={`${ingredient.name}: customer can change`}
                        label={<>Customer can {base ? "remove" : "add"}</>}
                        checked={!!rule}
                        disabled={!rule && options.length >= 40}
                        onChange={(e) =>
                          onOptions(
                            e.target.checked
                              ? [
                                  ...options,
                                  {
                                    ingredientId: ingredient.id,
                                    priceCents: 0,
                                    portionGrams: 10,
                                  },
                                ]
                              : options.filter(
                                  (o) => o.ingredientId !== ingredient.id,
                                ),
                          )
                        }
                      />
                    </div>
                  </div>
                  {rule && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {!base && (
                        <Input
                          label="Add price (€)"
                          type="number"
                          min="0"
                          max="1000"
                          step="0.01"
                          value={String(rule.priceCents / 100)}
                          onChange={(e) =>
                            update(ingredient.id, {
                              priceCents: Math.round(
                                Number(e.target.value) * 100,
                              ),
                            })
                          }
                        />
                      )}
                      <Input
                        label="Portion (grams)"
                        type="number"
                        min="0.1"
                        max="1000"
                        step="0.1"
                        value={String(rule.portionGrams)}
                        onChange={(e) =>
                          update(ingredient.id, {
                            portionGrams: Number(e.target.value),
                          })
                        }
                      />
                      <Input
                        label="Topping image URL (optional)"
                        value={rule.toppingImageUrl ?? ""}
                        onChange={(e) =>
                          update(ingredient.id, {
                            toppingImageUrl: e.target.value,
                          })
                        }
                        placeholder="Transparent image; uses ingredient image by default"
                      />
                    </div>
                  )}
                </div>
              );
            }}
          />
        }
      </div>
      {!library.length && (
        <p className="mt-2 text-sm text-muted">
          Create ingredients in the ingredient library first.
        </p>
      )}
    </fieldset>
  );
}
