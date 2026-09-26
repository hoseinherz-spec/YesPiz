"use client";
import { IngredientRulesEditor } from "./IngredientRulesEditor";
import { FormAction, FormScope, Input } from "@/components/AdminForms";

import { useState } from "react";
import {
  catalogClient,
  type Ingredient,
  type IngredientOptionConfig,
} from "@repo/api";

import { requireAdminToken } from "@/lib/auth";
export function MenuIngredients({
  id,
  ingredients,
  allergens,
  ingredientIds,
  ingredientOptions = [],
  toppingBaseImageUrl = "",
  library,
  onSaved,
}: {
  id: string;
  ingredients: string[];
  allergens: string[];
  ingredientIds: string[];
  ingredientOptions?: IngredientOptionConfig[];
  toppingBaseImageUrl?: string;
  library: Ingredient[];
  onSaved: () => Promise<void>;
}) {
  const [options, setOptions] = useState<IngredientOptionConfig[]>(
    ingredientOptions.map(
      ({ ingredientId, priceCents, portionGrams, toppingImageUrl }) => ({
        ingredientId,
        priceCents,
        portionGrams,
        toppingImageUrl,
      }),
    ),
  );
  const [baseImage, setBaseImage] = useState(toppingBaseImageUrl);
  const [selected, setSelected] = useState(ingredientIds);
  const [names, setNames] = useState(
    ingredientIds.length ? "" : ingredients.join(", "),
  );
  const [allergy, setAllergy] = useState(allergens.join(", "));
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setNotice("");
    try {
      await catalogClient.updateItem(
        id,
        {
          ingredientIds: selected,
          ingredientOptions: options,
          toppingBaseImageUrl: baseImage,
          ingredients: names
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          allergens: allergy
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        { accessToken: requireAdminToken() },
      );
      await onSaved();
      setNotice("Pizza information saved.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormScope>
      {
        <FormScope>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">
              Pizza ingredients & allergens
            </summary>
            <p className="mt-3 text-xs text-muted">
              Public information for this Yespizz pizza. Never include a kitchen
              name or address.
            </p>
            <IngredientRulesEditor
              library={library}
              selected={selected}
              options={options}
              onSelected={setSelected}
              onOptions={setOptions}
              disabled={busy}
            />
            <Input
              label="Pizza base image URL (optional)"
              value={baseImage}
              onChange={(e) => setBaseImage(e.target.value)}
              wrapperClassName="mt-3"
              placeholder="Pizza photo without customer-changeable toppings"
            />
            <p className="mt-1 text-xs text-muted">
              A clean base image lets the preview visually add and remove
              toppings. Without it, only extra toppings are drawn over the
              original photo.
            </p>
            <Input
              label={
                <>
                  Legacy ingredient names (used when no ingredients are
                  selected)
                </>
              }
              wrapperClassName="mt-3 block"
              maxLength={2000}
              className="mt-2 w-full rounded-xl bg-field-background p-3"
              value={names}
              onChange={(e) => setNames(e.target.value)}
            />
            <Input
              label={<>Allergens, separated by commas</>}
              wrapperClassName="mt-3 block"
              maxLength={1000}
              className="mt-2 w-full rounded-xl bg-field-background p-3"
              value={allergy}
              onChange={(e) => setAllergy(e.target.value)}
            />
            <FormAction
              variant="secondary"
              size="sm"
              className="mt-3"
              isDisabled={busy}
              onPress={() => void save()}
            >
              Save pizza information
            </FormAction>
            {notice && (
              <p role="status" className="mt-2">
                {notice}
              </p>
            )}
          </details>
        </FormScope>
      }
    </FormScope>
  );
}
