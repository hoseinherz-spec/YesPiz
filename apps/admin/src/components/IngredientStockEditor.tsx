"use client";
import { DataList } from "@/components/AdminTable";
import { Form, Input, FormValue, z } from "@/components/AdminForms";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  inventoryClient,
  type IngredientStock,
} from "@repo/api/domains/inventory";
export function IngredientStockEditor({
  providerId = "me",
  accessToken,
}: {
  providerId?: string;
  accessToken: string;
}) {
  const [stock, setStock] = useState<IngredientStock | null>(null),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setStock(await inventoryClient.read(providerId, { accessToken }));
      setError("");
      setSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load stock.");
    }
  }, [providerId, accessToken]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  async function save() {
    if (!stock || busy) return;
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const body = {
        enabled: stock.enabled,
        revision: stock.revision,
        items: stock.items,
      };
      setStock(await inventoryClient.update(providerId, body, { accessToken }));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save stock.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="data-surface space-y-5 rounded-3xl border border-border p-5">
      <div>
        <h2 className="text-xl font-semibold">Ingredient stock</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Record available grams using the exact ingredient names in the menu
          recipes. Tracked stock is reserved when a kitchen wins an order.
          Unsupported recipe options are excluded from tracked kitchens.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-success">
          Stock saved.
        </p>
      )}
      <Button variant="secondary" isDisabled={busy} onPress={() => void load()}>
        Reload stock
      </Button>
      {stock && (
        <Form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <FormValue
            name="stockItems"
            value={stock.items}
            schema={z
              .array(
                z.object({
                  name: z.string().trim().min(1).max(80),
                  grams: z.number().min(0).max(10000000),
                }),
              )
              .refine(
                (items) =>
                  new Set(items.map((item) => item.name.trim().toLowerCase()))
                    .size === items.length,
                "Use each ingredient name only once.",
              )}
          />
          <div className="flex items-start gap-3 text-sm">
            <Input
              label={
                <>
                  <span>
                    Require available ingredients before accepting orders
                    <small className="mt-1 block text-muted">
                      Enable only when your recipes and stock are complete.
                      Sizes, variants and extras use the measured recipe
                      coverage configured by the admin. Missing recipe coverage
                      blocks assignment.
                    </small>
                  </span>
                </>
              }
              type="checkbox"
              className="mt-1 size-5 shrink-0"
              checked={stock.enabled}
              onChange={(e) =>
                setStock({ ...stock, enabled: e.target.checked })
              }
            />
          </div>
          <div className="space-y-3">
            {
              <DataList
                data={stock.items}
                label="ingredient stock"
                renderItem={(item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(80px,120px)_auto] gap-2"
                  >
                    <div className="text-xs">
                      Ingredient
                      <Input
                        required
                        maxLength={80}
                        aria-label={`Ingredient ${i + 1}`}
                        className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3"
                        value={item.name}
                        onChange={(e) =>
                          setStock({
                            ...stock,
                            items: stock.items.map((v, n) =>
                              n === i ? { ...v, name: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="text-xs">
                      <Input
                        label={<>Grams</>}
                        required
                        type="number"
                        min={0}
                        max={10000000}
                        step="any"
                        className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3"
                        value={item.grams}
                        onChange={(e) =>
                          setStock({
                            ...stock,
                            items: stock.items.map((v, n) =>
                              n === i
                                ? { ...v, grams: Number(e.target.value) }
                                : v,
                            ),
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      aria-label={`Remove ${item.name || "ingredient"}`}
                      className="mt-5 min-h-12 min-w-11 rounded-xl border border-border"
                      onPress={() =>
                        setStock({
                          ...stock,
                          items: stock.items.filter((_, n) => n !== i),
                        })
                      }
                    >
                      ×
                    </Button>
                  </div>
                )}
              />
            }
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              isDisabled={stock.items.length >= 100 || busy}
              onPress={() =>
                setStock({
                  ...stock,
                  items: [...stock.items, { name: "", grams: 0 }],
                })
              }
            >
              Add ingredient
            </Button>
            <Button type="submit" isDisabled={busy}>
              {busy ? "Saving…" : "Save stock"}
            </Button>
          </div>
          <p className="text-xs text-muted">
            A concurrent order may change stock. If saving is rejected, reload
            and re-enter your counted quantities.
          </p>
        </Form>
      )}
    </section>
  );
}
