"use client";
import { useEffect, useState } from "react";
import { IngredientStockEditor } from "@repo/api/components/ingredient-stock";
import { getProviderToken } from "@/lib/auth";
export default function InventoryPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setToken(getProviderToken()), 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Kitchen stock</h1>
      {token ? (
        <IngredientStockEditor accessToken={token} />
      ) : (
        <p role="status">Loading kitchen access…</p>
      )}
    </div>
  );
}
