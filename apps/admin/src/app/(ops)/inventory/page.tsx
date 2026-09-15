"use client";
import { RecipeCoverageEditor } from "@/components/RecipeCoverageEditor";
import { useState } from "react";
import { Button } from "@heroui/react";
import { IngredientStockEditor } from "@repo/api/components/ingredient-stock";
import { requireAdminToken } from "@/lib/auth";
export default function InventoryPage() {
  const [draft, setDraft] = useState(""),
    [id, setId] = useState("");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Kitchen stock</h1>
      <RecipeCoverageEditor />
      <p className="text-sm text-muted">
        Choose a kitchen ID from Providers to review or update its ingredient
        inventory.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setId(draft.trim());
        }}
      >
        <label className="text-sm">
          Kitchen ID
          <input
            required
            pattern="[a-fA-F0-9]{24}"
            className="mt-2 block min-h-12 rounded-xl border border-border bg-surface px-4"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <Button type="submit">Load kitchen</Button>
      </form>
      {id && (
        <IngredientStockEditor
          key={id}
          providerId={id}
          accessToken={requireAdminToken()}
        />
      )}
    </div>
  );
}
