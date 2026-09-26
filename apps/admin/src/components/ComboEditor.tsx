"use client";
import { DataList } from "@/components/AdminTable";
import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { Form, Input, Select, FormValue, z } from "@/components/AdminForms";
import {
  catalogClient,
  type MenuItem,
  type Category,
  type ComboComponentInput,
} from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { entityId } from "@/lib/ids";

export function ComboEditor({
  versionId,
  items,
  categories,
  onSaved,
}: {
  versionId: string;
  items: MenuItem[];
  categories: Category[];
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<string>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<ComboComponentInput[]>([
    { menuItemId: "", quantity: 1 },
    { menuItemId: "", quantity: 1 },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const products = items.filter(
    (i) =>
      i.isActive !== false &&
      i.productType !== "combo" &&
      i.productType !== "unclassified" &&
      !i.customization?.groups.some((g) => g.min > 0),
  );
  const combos = items.filter((i) => i.productType === "combo");
  function reset() {
    setEditing(undefined);
    setName("");
    setDescription("");
    setPrice("");
    setRows([
      { menuItemId: "", quantity: 1 },
      { menuItemId: "", quantity: 1 },
    ]);
  }
  function update(index: number, patch: Partial<ComboComponentInput>) {
    setRows((previous) =>
      previous.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }
  async function save() {
    const cents = Math.round(Number(price) * 100);
    if (
      !name.trim() ||
      !price.trim() ||
      !Number.isSafeInteger(cents) ||
      cents < 0 ||
      rows.some((r) => !r.menuItemId) ||
      rows.reduce((n, r) => n + r.quantity, 0) < 2
    ) {
      setError("Choose at least two products, a name, and a valid price.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        priceCents: cents,
        categoryId: category || entityId(categories[0]!),
        comboComponents: rows.map(
          ({ menuItemId, quantity, size, variantId }) => ({
            menuItemId,
            quantity,
            size,
            variantId,
          }),
        ),
      };
      if (editing)
        await catalogClient.updateItem(editing, body, {
          accessToken: requireAdminToken(),
        });
      else
        await catalogClient.addItem(
          versionId,
          { ...body, productType: "combo" },
          { accessToken: requireAdminToken() },
        );
      await onSaved();
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save combo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="p-5">
      <Card.Content className="space-y-5 p-0">
        <div>
          <h2 className="text-xl font-semibold">Combos</h2>
          <p className="text-sm text-muted">
            Choose the products and sizes included, then set one price for the
            whole combo.
          </p>
        </div>
        {combos.length > 0 && (
          <div className="space-y-2">
            <DataList
              data={combos}
              label="combos"
              renderItem={(combo) => (
                <li
                  key={entityId(combo)}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-secondary p-3"
                >
                  <div>
                    <strong>{combo.name}</strong>
                    <p className="text-sm text-muted">
                      €{(combo.priceCents / 100).toFixed(2)} ·{" "}
                      {combo.comboComponents
                        ?.map(
                          (c) => `${c.quantity} × ${c.name} (${c.sizeName})`,
                        )
                        .join(" + ")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busy}
                    onPress={() => {
                      setEditing(entityId(combo));
                      setName(combo.name);
                      setDescription(combo.description);
                      setPrice((combo.priceCents / 100).toFixed(2));
                      setCategory(combo.categoryId);
                      setRows(combo.comboComponents ?? []);
                      setError("");
                    }}
                  >
                    Edit
                  </Button>
                </li>
              )}
            />
          </div>
        )}
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="space-y-4"
        >
          <FormValue
            name="comboComponents"
            value={rows}
            schema={z
              .array(
                z.object({
                  menuItemId: z.string().min(1, "Choose a product."),
                  quantity: z.number().int().min(1).max(20),
                }),
              )
              .min(1, "Choose products for the combo.")
              .max(12, "Use at most 12 selections.")
              .refine(
                (components) =>
                  components.reduce((sum, row) => sum + row.quantity, 0) >= 2,
                "A combo needs at least two products.",
              )}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Combo name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pizza party"
            />
            <Select
              label="Category"
              required
              value={category || (categories[0] ? entityId(categories[0]) : "")}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={entityId(c)} value={entityId(c)}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Your favourites, made for sharing."
            />
            <Input
              label="Combo price (€)"
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <fieldset disabled={busy} className="space-y-3">
            <legend className="mb-2 font-medium">Included products</legend>
            {rows.map((row, index) => {
              const product = products.find(
                (p) => entityId(p) === row.menuItemId,
              );
              const variants = product?.customization?.variants.filter(
                (v) => v.isActive,
              );
              return (
                <div
                  key={index}
                  className="grid items-end gap-3 rounded-2xl bg-surface-secondary p-3 sm:grid-cols-[2fr_1fr_90px_auto]"
                >
                  <Select
                    label={`Product ${index + 1}`}
                    required
                    value={row.menuItemId}
                    onChange={(e) => {
                      const next = products.find(
                        (p) => entityId(p) === e.target.value,
                      );
                      update(index, {
                        menuItemId: e.target.value,
                        variantId: next?.customization?.variants.find(
                          (v) => v.isActive,
                        )?.id,
                        size: next?.customization ? undefined : "medium",
                      });
                    }}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={entityId(p)} value={entityId(p)}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Size"
                    value={row.variantId ?? row.size ?? "medium"}
                    onChange={(e) =>
                      update(
                        index,
                        variants
                          ? { variantId: e.target.value, size: undefined }
                          : {
                              size: e.target
                                .value as ComboComponentInput["size"],
                            },
                      )
                    }
                  >
                    {variants ? (
                      variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))
                    ) : product?.productType === "pizza" ? (
                      ["small", "medium", "large"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    ) : (
                      <option value="medium">Standard</option>
                    )}
                  </Select>
                  <Input
                    label="Quantity"
                    required
                    type="number"
                    min="1"
                    max="20"
                    value={String(row.quantity)}
                    onChange={(e) =>
                      update(index, { quantity: Number(e.target.value) })
                    }
                  />
                  <Button
                    variant="ghost"
                    aria-label={`Remove product ${index + 1}`}
                    isDisabled={rows.length === 1}
                    onPress={() => setRows(rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              isDisabled={busy || rows.length >= 12}
              onPress={() =>
                setRows([...rows, { menuItemId: "", quantity: 1 }])
              }
            >
              Add product
            </Button>
            <Button type="submit" isDisabled={busy || !categories.length}>
              {busy ? "Saving…" : editing ? "Save combo" : "Create combo"}
            </Button>
            {editing && (
              <Button variant="ghost" isDisabled={busy} onPress={reset}>
                Cancel
              </Button>
            )}
          </div>
          {!categories.length && (
            <p className="text-sm text-muted">
              Add a category before creating a combo.
            </p>
          )}
        </Form>
      </Card.Content>
    </Card>
  );
}
