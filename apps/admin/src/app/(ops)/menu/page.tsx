"use client";
import { FormAction, FormScope, Input, Form, Select } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import {
  PizzaMenuEditor,
  MenuCategoryEditor,
} from "@/components/PizzaMenuEditor";
import { MenuIngredients } from "@/components/MenuIngredients";

import {
  ApiError,
  apiRequest,
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
  const [publishAt, setPublishAt] = useState("");
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
        (detail.categories.some((c) => entityId(c) === f.categoryId)
          ? f.categoryId
          : "") || (detail.categories[0] ? entityId(detail.categories[0]) : ""),
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
    changes: {
      name?: string;
      priceCents?: number;
      isActive?: boolean;
      productType?: "pizza" | "unclassified";
    },
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
    <FormScope>
      {
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div>
            <Typography type="h1" className="text-2xl font-semibold">
              Menu
            </Typography>
            <p className="text-muted text-sm">
              Manage catalog versions, categories, and items
            </p>
          </div>

          <p className="text-sm text-muted">
            Only pizza can be sold. Existing unclassified items stay hidden
            until an administrator confirms they are pizza. Ingredients and
            allergens must match the actual recipe.
          </p>

          {error ? (
            <p
              role="alert"
              className="rounded-2xl bg-danger-soft p-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

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
              <FormScope>
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    label={<>Notes</>}
                    wrapperClassName="flex flex-1 flex-col gap-1 text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border-border bg-background rounded-md border px-3 py-2"
                    placeholder="Optional version notes"
                  />
                  <FormAction
                    variant="secondary"
                    isDisabled={busy}
                    onPress={createVersion}
                  >
                    Create version
                  </FormAction>
                  <Button
                    variant="primary"
                    isDisabled={busy || !selectedId || selected?.published}
                    onPress={publish}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="secondary"
                    isDisabled={busy || !selectedId}
                    onPress={async () => {
                      if (!selectedId) return;
                      setBusy(true);
                      setError(null);
                      try {
                        const copy = await apiRequest<MenuVersion>(
                          `/api/v1/catalog/versions/${selectedId}/clone`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${requireAdminToken()}`,
                            },
                          },
                        );
                        setSelectedId(entityId(copy));
                        await loadVersions();
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Copy failed",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Copy to new draft
                  </Button>
                  <FormScope>
                    <Input
                      label={<>Publish at (your local time)</>}
                      wrapperClassName="text-sm"
                      type="datetime-local"
                      className="ml-2 rounded-lg border border-border bg-background p-2"
                      required
                      value={publishAt}
                      onChange={(e) => setPublishAt(e.target.value)}
                    />
                    <FormAction
                      variant="secondary"
                      isDisabled={
                        busy || !selectedId || selected?.published || !publishAt
                      }
                      onPress={async () => {
                        if (!selectedId) return;
                        setBusy(true);
                        setError(null);
                        try {
                          await apiRequest(
                            `/api/v1/catalog/versions/${selectedId}/schedule`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${requireAdminToken()}`,
                              },
                              body: {
                                scheduledPublishAt: new Date(
                                  publishAt,
                                ).toISOString(),
                              },
                            },
                          );
                          await loadVersions();
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Scheduling failed",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Schedule publication
                    </FormAction>
                  </FormScope>
                  {selected?.scheduledPublishAt && (
                    <div className="text-sm">
                      Scheduled:{" "}
                      {new Date(selected.scheduledPublishAt).toLocaleString()}{" "}
                      <FormButton
                        variant="ghost"
                        type="button"
                        className="underline"
                        isDisabled={busy}
                        onPress={async () => {
                          setBusy(true);
                          try {
                            await apiRequest(
                              `/api/v1/catalog/versions/${selectedId}/schedule`,
                              {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${requireAdminToken()}`,
                                },
                                body: {},
                              },
                            );
                            await loadVersions();
                          } catch (e) {
                            setError(
                              e instanceof Error ? e.message : "Cancel failed",
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Cancel schedule
                      </FormButton>
                    </div>
                  )}
                  {selected?.publishError && (
                    <p role="alert">{selected.publishError}</p>
                  )}
                </div>
              </FormScope>
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
                        <MenuCategoryEditor
                          category={c}
                          onSaved={() => loadDetail(selectedId)}
                        />
                      </li>
                    ))}
                    {!categories.length ? (
                      <li className="text-muted">No categories yet</li>
                    ) : null}
                  </ul>
                  <FormScope>
                    <div className="flex flex-wrap items-end gap-2">
                      <Input
                        label={<>Category name</>}
                        wrapperClassName="flex flex-1 flex-col gap-1 text-sm"
                        required
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="border-border bg-background rounded-md border px-3 py-2"
                      />
                      <FormAction
                        variant="secondary"
                        isDisabled={busy}
                        onPress={addCategory}
                      >
                        Add category
                      </FormAction>
                    </div>
                  </FormScope>
                </Card.Content>
              </Card>

              <Card className="p-4">
                <FormScope>
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
                            <Form
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
                              <Input
                                label={<>Item name</>}
                                wrapperClassName="grid gap-1"
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
                              <Input
                                label={<>Price (€)</>}
                                wrapperClassName="grid gap-1"
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                readOnly={!!item.customization}
                                value={editing.price}
                                onChange={(event) =>
                                  setEditing({
                                    ...editing,
                                    price: event.target.value,
                                  })
                                }
                                className="border border-border px-3 py-2"
                              />
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
                            </Form>
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="font-semibold">{item.name}</div>
                                <p className="text-muted">
                                  {item.customization ? "From " : ""}€
                                  {(
                                    (item.customization
                                      ? Math.min(
                                          ...item.customization.variants
                                            .filter((v) => v.isActive)
                                            .map((v) => v.priceCents),
                                        )
                                      : item.priceCents) / 100
                                  ).toFixed(2)}{" "}
                                  ·{" "}
                                  {categories.find(
                                    (c) => entityId(c) === item.categoryId,
                                  )?.name ?? "Category unavailable"}{" "}
                                  ·{" "}
                                  {item.isActive === false
                                    ? "Hidden"
                                    : "Active"}
                                  {item.productType !== "pizza" && (
                                    <FormButton
                                      variant="ghost"
                                      type="button"
                                      className="ml-2 underline"
                                      onPress={() =>
                                        void updateItem(entityId(item), {
                                          productType: "pizza",
                                        })
                                      }
                                    >
                                      Confirm this item is pizza
                                    </FormButton>
                                  )}
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
                          <PizzaMenuEditor
                            item={item}
                            categories={categories}
                            onSaved={() => loadDetail(selectedId)}
                          />
                          <MenuIngredients
                            id={entityId(item)}
                            ingredients={item.ingredients ?? []}
                            allergens={item.allergens ?? []}
                          />
                        </li>
                      ))}
                      {!items.length ? (
                        <li className="text-muted">No items yet</li>
                      ) : null}
                    </ul>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Select
                        searchable
                        label={<>Category</>}
                        wrapperClassName="flex flex-col gap-1 text-sm"
                        required
                        value={itemForm.categoryId}
                        onChange={(e) =>
                          setItemForm((f) => ({
                            ...f,
                            categoryId: e.target.value,
                          }))
                        }
                        className="border-border bg-background rounded-md border px-3 py-2"
                      >
                        <option value="">Select…</option>
                        {categories.map((c) => (
                          <option key={entityId(c)} value={entityId(c)}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label={<>Name</>}
                        wrapperClassName="flex flex-col gap-1 text-sm"
                        required
                        value={itemForm.name}
                        onChange={(e) =>
                          setItemForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="border-border bg-background rounded-md border px-3 py-2"
                      />
                      <Input
                        label={<>Description</>}
                        wrapperClassName="flex flex-col gap-1 text-sm md:col-span-2"
                        value={itemForm.description}
                        onChange={(e) =>
                          setItemForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        className="border-border bg-background rounded-md border px-3 py-2"
                      />
                      <Input
                        label={<>Price (€)</>}
                        wrapperClassName="flex flex-col gap-1 text-sm"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={itemForm.priceEuros}
                        onChange={(e) =>
                          setItemForm((f) => ({
                            ...f,
                            priceEuros: e.target.value,
                          }))
                        }
                        className="border-border bg-background rounded-md border px-3 py-2"
                      />
                    </div>
                    <FormAction
                      variant="secondary"
                      isDisabled={busy}
                      onPress={addItem}
                    >
                      Add item
                    </FormAction>
                  </Card.Content>
                </FormScope>
              </Card>
            </>
          ) : null}
        </div>
      }
    </FormScope>
  );
}
