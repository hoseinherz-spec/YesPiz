"use client";

import {
  ApiError,
  catalogClient,
  type Category,
  type MenuItem,
  type MenuVersion,
} from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
import { entityId } from "@/lib/ids";
import { useLoadOnMount } from "@/lib/load-on-mount";

export default function MenuPage() {
  const [versions, setVersions] = useState<MenuVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [notes, setNotes] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [itemForm, setItemForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    priceEuros: "9.99",
  });
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadVersions = useCallback(async () => {
    const token = requireAdminToken();
    const list = await catalogClient.listVersions({ accessToken: token });
    setVersions(list);
    setSelectedId((prev) => prev ?? (list[0] ? entityId(list[0]) : null));
  }, []);

  const loadDetail = useCallback(async (versionId: string) => {
    const token = requireAdminToken();
    const detail = await catalogClient.getVersion(versionId, {
      accessToken: token,
    });
    setCategories(detail.categories);
    setItems(detail.items);
    setItemForm((f) => ({
      ...f,
      categoryId:
        f.categoryId ||
        (detail.categories[0] ? entityId(detail.categories[0]) : ""),
    }));
  }, []);

  useLoadOnMount(() =>
    loadVersions().catch((err) =>
      setError(
        err instanceof ApiError ? err.message : "Failed to load versions",
      ),
    ),
  );

  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      loadDetail(selectedId).catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load menu"),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedId, loadDetail]);

  async function createVersion() {
    setBusy(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const created = await catalogClient.createVersion(
        { notes: notes || undefined },
        { accessToken: token },
      );
      setNotes("");
      setSelectedId(entityId(created));
      await loadVersions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireAdminToken();
      await catalogClient.publish(selectedId, { accessToken: token });
      await loadVersions();
      await loadDetail(selectedId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function addCategory() {
    if (!selectedId || !categoryName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireAdminToken();
      await catalogClient.addCategory(
        selectedId,
        { name: categoryName.trim() },
        { accessToken: token },
      );
      setCategoryName("");
      await loadDetail(selectedId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Add category failed");
    } finally {
      setBusy(false);
    }
  }

  async function addItem() {
    if (!selectedId || !itemForm.categoryId || !itemForm.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const priceCents = Math.round(Number(itemForm.priceEuros) * 100);
      await catalogClient.addItem(
        selectedId,
        {
          categoryId: itemForm.categoryId,
          name: itemForm.name.trim(),
          description: itemForm.description || undefined,
          priceCents,
        },
        { accessToken: token },
      );
      setItemForm((f) => ({ ...f, name: "", description: "" }));
      await loadDetail(selectedId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Add item failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateItem(
    itemId: string,
    changes: { name?: string; priceCents?: number; isActive?: boolean },
  ) {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      await catalogClient.updateItem(itemId, changes, {
        accessToken: requireAdminToken(),
      });
      await loadDetail(selectedId);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const selected = versions.find((v) => entityId(v) === selectedId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <Typography type="h1" className="text-2xl font-semibold">
          Menu
        </Typography>
        <p className="text-muted text-sm">
          Manage catalog versions, categories, and items
        </p>
      </div>

      {error ? <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3 p-0">
          <Typography type="h3" className="font-medium">
            Versions
          </Typography>
          <div className="flex flex-wrap gap-2">
            {versions.map((v) => {
              const id = entityId(v);
              return (
                <Button
                  key={id}
                  size="sm"
                  variant={id === selectedId ? "primary" : "secondary"}
                  onPress={() => setSelectedId(id)}
                >
                  v{v.version}
                  {v.published ? " · published" : ""}
                </Button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Notes
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-border bg-background rounded-md border px-3 py-2"
                placeholder="Optional version notes"
              />
            </label>
            <Button
              variant="secondary"
              isDisabled={busy}
              onPress={createVersion}
            >
              Create version
            </Button>
            <Button
              variant="primary"
              isDisabled={busy || !selectedId || selected?.published}
              onPress={publish}
            >
              Publish
            </Button>
          </div>
        </Card.Content>
      </Card>

      {selectedId ? (
        <>
          <Card className="p-4">
            <Card.Content className="flex flex-col gap-3 p-0">
              <Typography type="h3" className="font-medium">
                Categories
              </Typography>
              <ul className="space-y-1 text-sm">
                {categories.map((c) => (
                  <li key={entityId(c)}>
                    {c.name}{" "}
                    <span className="text-muted">(sort {c.sortOrder})</span>
                  </li>
                ))}
                {!categories.length ? (
                  <li className="text-muted">No categories yet</li>
                ) : null}
              </ul>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  Category name
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="border-border bg-background rounded-md border px-3 py-2"
                  />
                </label>
                <Button
                  variant="secondary"
                  isDisabled={busy}
                  onPress={addCategory}
                >
                  Add category
                </Button>
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4">
            <Card.Content className="flex flex-col gap-3 p-0">
              <Typography type="h3" className="font-medium">
                Items
              </Typography>
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li
                    key={entityId(item)}
                    className="border-border rounded-md border p-2"
                  >
                    {editing?.id === entityId(item) ? (
                      <form
                        className="grid gap-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const price = Number(editing.price);
                          if (
                            !editing.name.trim() ||
                            !Number.isFinite(price) ||
                            price < 0
                          )
                            return;
                          void updateItem(editing.id, {
                            name: editing.name.trim(),
                            priceCents: Math.round(price * 100),
                          });
                        }}
                      >
                        <label className="grid gap-1">
                          Item name
                          <input
                            required
                            value={editing.name}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                name: event.target.value,
                              })
                            }
                            className="border border-border px-3 py-2"
                          />
                        </label>
                        <label className="grid gap-1">
                          Price (€)
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={editing.price}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                price: event.target.value,
                              })
                            }
                            className="border border-border px-3 py-2"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button type="submit" isDisabled={busy}>
                            Save item
                          </Button>
                          <Button
                            variant="secondary"
                            isDisabled={busy}
                            onPress={() => setEditing(null)}
                          >
                            Cancel edit
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <p className="text-muted">
                            €{(item.priceCents / 100).toFixed(2)} ·{" "}
                            {categories.find(
                              (c) => entityId(c) === item.categoryId,
                            )?.name ?? "Category unavailable"}{" "}
                            · {item.isActive === false ? "Hidden" : "Active"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            isDisabled={busy}
                            onPress={() =>
                              setEditing({
                                id: entityId(item),
                                name: item.name,
                                price: (item.priceCents / 100).toFixed(2),
                              })
                            }
                          >
                            Edit item
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            isDisabled={busy}
                            onPress={() =>
                              void updateItem(entityId(item), {
                                isActive: item.isActive === false,
                              })
                            }
                          >
                            {item.isActive === false
                              ? "Show item"
                              : "Hide item"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {!items.length ? (
                  <li className="text-muted">No items yet</li>
                ) : null}
              </ul>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  Category
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, categoryId: e.target.value }))
                    }
                    className="border-border bg-background rounded-md border px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={entityId(c)} value={entityId(c)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Name
                  <input
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="border-border bg-background rounded-md border px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  Description
                  <input
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    className="border-border bg-background rounded-md border px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Price (€)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.priceEuros}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, priceEuros: e.target.value }))
                    }
                    className="border-border bg-background rounded-md border px-3 py-2"
                  />
                </label>
              </div>
              <Button variant="secondary" isDisabled={busy} onPress={addItem}>
                Add item
              </Button>
            </Card.Content>
          </Card>
        </>
      ) : null}
    </div>
  );
}
