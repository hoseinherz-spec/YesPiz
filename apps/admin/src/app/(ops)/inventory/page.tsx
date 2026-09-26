"use client";
import { Form, Input } from "@/components/AdminForms";
import { RecipeCoverageEditor } from "@/components/RecipeCoverageEditor";
import { useState } from "react";
import { Button } from "@heroui/react";
import { IngredientStockEditor } from "@/components/IngredientStockEditor";
import { requireAdminToken } from "@/lib/auth";
export default function InventoryPage() {
  const [draft, setDraft] = useState(""),
    [id, setId] = useState("");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Kitchen stock</h1>
      <RecipeCoverageEditor />
      <p className="text-sm text-muted">
        Choose a kitchen to review or update its ingredient inventory.
      </p>
      <Form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setId(draft.trim());
        }}
      >
        <div className="text-sm">
          <Input
            required
            entity="provider"
            label="Kitchen"
            className="mt-2 block min-h-12 rounded-xl border border-border bg-surface px-4"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
        <Button type="submit">Load kitchen</Button>
      </Form>
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
