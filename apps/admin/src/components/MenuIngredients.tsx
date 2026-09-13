"use client";
import { FormAction, FormScope, Input } from "@repo/ui/forms";

import { useState } from "react";
import { catalogClient } from "@repo/api";

import { requireAdminToken } from "@/lib/auth";
export function MenuIngredients({
  id,
  ingredients,
  allergens,
}: {
  id: string;
  ingredients: string[];
  allergens: string[];
}) {
  const [names, setNames] = useState(ingredients.join(", "));
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
            <Input
              label={<>Ingredients, separated by commas</>}
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
