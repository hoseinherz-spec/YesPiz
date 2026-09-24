"use client";
import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { Form, Input } from "@repo/ui/forms";
import {
  catalogClient,
  type Ingredient,
  type CreateIngredientRequest,
} from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";

const empty: CreateIngredientRequest = {
  name: "",
  description: "",
  slug: "",
  image: "",
};
export function IngredientLibrary({
  onChange,
}: {
  onChange: (items: Ingredient[]) => void;
}) {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load() {
    try {
      const rows = await catalogClient.listIngredients({
        accessToken: requireAdminToken(),
      });
      setItems(rows);
      onChange(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load ingredients.");
    } finally {
      setLoading(false);
    }
  }
  useLoadOnMount(load);
  function reset() {
    setEditing(null);
    setForm(empty);
  }
  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const options = { accessToken: requireAdminToken() };
      const body = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        image: form.image.trim(),
      };
      if (editing) await catalogClient.updateIngredient(editing, body, options);
      else await catalogClient.createIngredient(body, options);
      reset();
      await load();
      setNotice("Ingredient saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save ingredient.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await catalogClient.deleteIngredient(id, {
        accessToken: requireAdminToken(),
      });
      if (editing === id) reset();
      setDeleting(null);
      await load();
      setNotice("Ingredient deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete ingredient.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="p-5" id="ingredient-library">
      <Card.Content className="space-y-4 p-0">
        <div>
          <h2 className="text-lg font-semibold">Ingredient library</h2>
          <p className="text-sm text-muted">
            Manage reusable ingredients, then select them on each pizza. Changes
            appear everywhere the ingredient is used.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}{" "}
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                setError("");
                void load();
              }}
              isDisabled={busy}
            >
              Retry loading
            </Button>
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-success">
            {notice}
          </p>
        )}
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Input
            label="Ingredient name"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={100}
            placeholder="red-onion"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <Input
            label="Description"
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Image URL"
            type="url"
            maxLength={2048}
            placeholder="https://…"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" isDisabled={busy || loading}>
              {editing ? "Save ingredient" : "Create ingredient"}
            </Button>
            {editing && (
              <Button variant="secondary" onPress={reset} isDisabled={busy}>
                Cancel edit
              </Button>
            )}
          </div>
        </Form>
        {loading ? (
          <p role="status">Loading ingredients…</p>
        ) : !items.length ? (
          <p className="text-sm text-muted">
            No ingredients yet. Add your first ingredient above.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-secondary">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={item.image}
                      src={item.image}
                      alt=""
                      className="size-full object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-muted">{item.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="break-words text-xs text-muted">{item.slug}</p>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => {
                    setEditing(item.id);
                    setForm({
                      name: item.name,
                      slug: item.slug,
                      description: item.description,
                      image: item.image,
                    });
                    setError("");
                    setNotice("");
                  }}
                >
                  Edit {item.name}
                </Button>
                {deleting === item.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      isDisabled={busy}
                      onPress={() => void remove(item.id)}
                    >
                      Confirm delete {item.name}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setDeleting(null)}
                      isDisabled={busy}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={busy}
                    onPress={() => setDeleting(item.id)}
                  >
                    Delete {item.name}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
