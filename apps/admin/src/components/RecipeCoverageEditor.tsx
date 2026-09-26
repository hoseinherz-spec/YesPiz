"use client";
import { Form, Input, Select, FormValue, z } from "@/components/AdminForms";
import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";
type Choice = {
  kind: string;
  key: string;
  ingredients: Array<{ name: string; weightGrams: number }>;
};
type Pizza = {
  id: string;
  name: string;
  revision: number;
  choices: Choice[];
  variants: Array<{ key: string; name: string }>;
  options: Array<{ key: string; name: string }>;
};
export function RecipeCoverageEditor() {
  const [items, setItems] = useState<Pizza[]>([]),
    [item, setItem] = useState<Pizza | null>(null),
    [rules, setRules] = useState<Choice[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setItems(
        await apiRequest<Pizza[]>(
          "/api/v1/inventory-recipes",
          withAuth({ accessToken: requireAdminToken() }),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load recipes.");
    }
  }, []);
  useLoadOnMount(load);
  const field =
    "min-h-11 w-full rounded-xl border border-border bg-background px-3";
  function change(index: number, rule: Choice) {
    setRules((old) => old.map((r, i) => (i === index ? rule : r)));
  }
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">Recipe coverage</h2>
      <p className="mt-2 text-sm text-muted">
        Enter full measured recipes for sizes/variants. Extras and options add
        their ingredient weights. Recipes are frozen into new orders; existing
        orders keep their snapshot.
      </p>
      <div className="mt-4 block text-sm">
        <Select
          label={<>Pizza</>}
          className={field}
          value={item?.id ?? ""}
          disabled={busy}
          onChange={(e) => {
            const p = items.find((i) => i.id === e.target.value) ?? null;
            setItem(p);
            setRules(p?.choices ?? []);
            setNotice("");
            setError("");
          }}
        >
          <option value="">Choose pizza</option>
          {items.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      {item && (
        <Form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            void apiRequest<{ revision: number }>(
              `/api/v1/inventory-recipes/${item.id}`,
              withAuth({
                accessToken: requireAdminToken(),
                method: "POST",
                body: { revision: item.revision, choices: rules },
              }),
            )
              .then((result) => {
                setItem({ ...item, revision: result.revision, choices: rules });
                setNotice("Recipe coverage saved.");
                void load();
              })
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        >
          <FormValue
            name="recipeCoverage"
            value={rules}
            schema={z
              .array(
                z.object({
                  kind: z.enum(["size", "extra", "variant", "option"]),
                  key: z.string().trim().min(1, "Choose a recipe choice."),
                  ingredients: z.array(
                    z.object({
                      name: z
                        .string()
                        .trim()
                        .min(1, "Enter an ingredient name."),
                      weightGrams: z.number().min(0.01).max(100000),
                    }),
                  ),
                }),
              )
              .refine(
                (rows) =>
                  new Set(rows.map((row) => `${row.kind}:${row.key}`)).size ===
                  rows.length,
                "Each recipe choice must be unique.",
              )}
          />
          {rules.map((rule, index) => (
            <fieldset
              key={index}
              className="space-y-3 rounded-2xl border border-border p-4"
            >
              <legend>Recipe {index + 1}</legend>
              <div className="block text-sm">
                <Select
                  label={<>Choice type</>}
                  className={field}
                  value={rule.kind}
                  onChange={(e) =>
                    change(index, { ...rule, kind: e.target.value, key: "" })
                  }
                >
                  {["size", "extra", "variant", "option"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
              </div>
              <div className="block text-sm">
                {rule.kind === "extra" ? (
                  <Input
                    label="Choice"
                    required
                    placeholder="Exact extra name used by checkout"
                    value={rule.key}
                    className={field}
                    onChange={(e) =>
                      change(index, { ...rule, key: e.target.value })
                    }
                  />
                ) : (
                  <Select
                    label="Choice"
                    required
                    value={rule.key}
                    className={field}
                    onChange={(e) =>
                      change(index, { ...rule, key: e.target.value })
                    }
                  >
                    <option value="">Choose</option>
                    {(rule.kind === "size"
                      ? ["small", "medium", "large"].map((key) => ({
                          key,
                          name: key,
                        }))
                      : rule.kind === "variant"
                        ? item.variants
                        : item.options
                    ).map((v) => (
                      <option key={v.key} value={v.key}>
                        {v.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              {rule.ingredients.map((ing, j) => (
                <div key={j} className="grid grid-cols-[1fr_100px_auto] gap-2">
                  <Input
                    required
                    aria-label="Ingredient name"
                    placeholder="Ingredient"
                    className={field}
                    value={ing.name}
                    onChange={(e) =>
                      change(index, {
                        ...rule,
                        ingredients: rule.ingredients.map((i, k) =>
                          k === j ? { ...i, name: e.target.value } : i,
                        ),
                      })
                    }
                  />
                  <Input
                    required
                    aria-label="Grams"
                    type="number"
                    min="0.01"
                    max="100000"
                    step="0.01"
                    className={field}
                    value={ing.weightGrams}
                    onChange={(e) =>
                      change(index, {
                        ...rule,
                        ingredients: rule.ingredients.map((i, k) =>
                          k === j
                            ? { ...i, weightGrams: Number(e.target.value) }
                            : i,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    onPress={() =>
                      change(index, {
                        ...rule,
                        ingredients: rule.ingredients.filter((_, k) => k !== j),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                onPress={() =>
                  change(index, {
                    ...rule,
                    ingredients: [
                      ...rule.ingredients,
                      { name: "", weightGrams: 1 },
                    ],
                  })
                }
              >
                Add ingredient
              </Button>
              <Button
                variant="ghost"
                onPress={() =>
                  setRules((old) => old.filter((_, i) => i !== index))
                }
              >
                Remove recipe
              </Button>
            </fieldset>
          ))}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              isDisabled={busy}
              onPress={() =>
                setRules((old) => [
                  ...old,
                  {
                    kind: "size",
                    key: "",
                    ingredients: [{ name: "", weightGrams: 1 }],
                  },
                ])
              }
            >
              Add measured recipe
            </Button>
            <Button type="submit" isDisabled={busy}>
              Save recipes
            </Button>
          </div>
        </Form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3">
          {notice}
        </p>
      )}
    </section>
  );
}
