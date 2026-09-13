"use client";
import { FormValue, FormScope } from "@repo/ui/forms";
import {
  pizzaCustomizationSchema,
  pizzaPresentationSchema,
} from "@repo/ui/form-schemas";
import { Form, Fieldset, TextArea, Input, Select } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { PizzaChoices } from "@repo/api/components/pizza-choices";
import type { PizzaSelection } from "@repo/api";
import { useState } from "react";
import {
  apiRequest,
  catalogClient,
  type MenuItem,
  type Category,
  type PizzaPresentation,
  type PizzaCustomization,
} from "@repo/api";
import { requireAdminToken } from "@/lib/auth";

const field = "w-full rounded-lg border border-border bg-background px-3 py-2";
const action =
  "rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50";
const uid = () => crypto.randomUUID();
export function PizzaMenuEditor({
  item,
  categories,
  onSaved,
}: {
  item: MenuItem;
  categories: Category[];
  onSaved: () => Promise<void>;
}) {
  const [config, setConfig] = useState<PizzaCustomization>(
    item.customization ?? {
      variants: [
        {
          id: uid(),
          name: "Regular",
          priceCents: item.priceCents,
          isActive: true,
        },
      ],
      groups: [],
    },
  );
  const [presentation, setPresentation] = useState<PizzaPresentation>(
    item.presentation ?? {
      gallery: [],
      fields: [],
      availability: {
        enabled: false,
        timezone: "Europe/Vienna",
        periods: [],
        closedDates: [],
      },
    },
  );
  const [previewVariant, setPreviewVariant] = useState("");
  const [previewSelections, setPreviewSelections] = useState<PizzaSelection[]>(
    [],
  );
  const [enabled, setEnabled] = useState(!!item.customization);
  const [description, setDescription] = useState(item.description);
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [additionalCategoryIds, setAdditionalCategories] = useState(
    item.additionalCategoryIds ?? [],
  );
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [sortOrder, setSortOrder] = useState(item.sortOrder ?? 0);
  const [tags, setTags] = useState(item.tags.join(", "));
  const [recipe, setRecipe] = useState(item.recipeIngredients ?? []);
  const [cookTimeSeconds, setCookTime] = useState(item.cookTimeSeconds ?? 0);
  const [handoffTempC, setTemperature] = useState(item.handoffTempC ?? 65);
  const [requiresNumberedSeal, setSeal] = useState(
    item.requiresNumberedSeal ?? true,
  );
  const [requiresReadyPhoto, setPhoto] = useState(
    item.requiresReadyPhoto ?? false,
  );
  const [checks, setChecks] = useState(
    (item.checklistTemplate ?? []).join("\n"),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const groupChange = (
    index: number,
    value: Partial<PizzaCustomization["groups"][number]>,
  ) =>
    setConfig((c) => ({
      ...c,
      groups: c.groups.map((g, i) => (i === index ? { ...g, ...value } : g)),
    }));
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await catalogClient.updateItem(
        item.id,
        {
          presentation: {
            ...presentation,
            gallery: presentation.gallery.map((s) => s.trim()).filter(Boolean),
            availability: {
              ...presentation.availability,
              closedDates: presentation.availability.closedDates
                .map((s) => s.trim())
                .filter(Boolean),
            },
          },
          description,
          imageUrl,
          categoryId,
          additionalCategoryIds,
          sortOrder,
          tags: tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          recipeIngredients: recipe,
          cookTimeSeconds,
          handoffTempC,
          requiresNumberedSeal,
          requiresReadyPhoto,
          checklistTemplate: checks
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          ...(enabled ? { customization: config } : {}),
        },
        { accessToken: requireAdminToken() },
      );
      await onSaved();
      setMessage("Pizza settings saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="mt-3 rounded-xl border border-border p-3">
      <summary className="cursor-pointer font-semibold">
        Pizza builder · choices, recipe and presentation
      </summary>
      <Form
        className="mt-4 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {enabled && (
          <FormValue
            name="customization"
            value={config}
            schema={pizzaCustomizationSchema}
          />
        )}
        <FormValue
          name="presentation"
          value={{
            ...presentation,
            gallery: presentation.gallery.map((s) => s.trim()).filter(Boolean),
            availability: {
              ...presentation.availability,
              closedDates: presentation.availability.closedDates
                .map((s) => s.trim())
                .filter(Boolean),
            },
          }}
          schema={pizzaPresentationSchema}
        />
        <Fieldset disabled={busy} className="grid gap-4">
          <TextArea
            label={<>Description</>}
            className={field}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label={<>Image URL</>}
            type="url"
            className={field}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              searchable
              label={<>Category</>}
              className={field}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label={<>Display order</>}
              className={field}
              type="number"
              step="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
            <Input
              label={<>Tags, separated by commas</>}
              className={field}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <Fieldset>
            <Fieldset.Legend>Also show in these categories</Fieldset.Legend>
            <div className="flex flex-wrap gap-3">
              {categories
                .filter((c) => c.id !== categoryId)
                .map((c) => (
                  <Input
                    label={<> {c.name}</>}
                    key={c.id}
                    type="checkbox"
                    checked={additionalCategoryIds.includes(c.id)}
                    onChange={(e) =>
                      setAdditionalCategories((ids) =>
                        e.target.checked
                          ? [...ids, c.id]
                          : ids.filter((id) => id !== c.id),
                      )
                    }
                  />
                ))}
            </div>
          </Fieldset>
          {!enabled && (
            <FormButton
              variant="ghost"
              type="button"
              className={action}
              onPress={() => setEnabled(true)}
            >
              Configure custom sizes and choices
            </FormButton>
          )}
          {enabled && (
            <>
              <h3 className="font-semibold">
                Sizes and styles · each price is the full pizza price
              </h3>
              {config.variants.map((v, index) => (
                <div
                  key={v.id}
                  className="grid items-end gap-2 rounded-xl border border-border p-3 md:grid-cols-4"
                >
                  <Input
                    label={<>Name</>}
                    required
                    maxLength={120}
                    className={field}
                    value={v.name}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        variants: c.variants.map((x, i) =>
                          i === index ? { ...x, name: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <Input
                    label={<>Price (€)</>}
                    required
                    className={field}
                    type="number"
                    min="0"
                    max="10000"
                    step="0.01"
                    value={v.priceCents / 100}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        variants: c.variants.map((x, i) =>
                          i === index
                            ? {
                                ...x,
                                priceCents: Math.round(
                                  Number(e.target.value) * 100,
                                ),
                              }
                            : x,
                        ),
                      }))
                    }
                  />
                  <Input
                    label={<> Available</>}
                    type="checkbox"
                    checked={v.isActive}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        variants: c.variants.map((x, i) =>
                          i === index
                            ? { ...x, isActive: e.target.checked }
                            : x,
                        ),
                      }))
                    }
                  />
                  <FormButton
                    variant="ghost"
                    type="button"
                    className={action}
                    isDisabled={config.variants.length === 1}
                    onPress={() =>
                      setConfig((c) => ({
                        ...c,
                        variants: c.variants.filter((x) => x.id !== v.id),
                        groups: c.groups.map((g) => ({
                          ...g,
                          options: g.options.map((o) => ({
                            ...o,
                            variantIds: o.variantIds.filter(
                              (id) => id !== v.id,
                            ),
                            priceOverrides: o.priceOverrides?.filter(
                              (p) => p.variantId !== v.id,
                            ),
                          })),
                        })),
                      }))
                    }
                  >
                    Remove size
                  </FormButton>
                </div>
              ))}
              <FormButton
                variant="ghost"
                type="button"
                className={action}
                isDisabled={config.variants.length >= 20}
                onPress={() =>
                  setConfig((c) => ({
                    ...c,
                    variants: [
                      ...c.variants,
                      {
                        id: uid(),
                        name: "",
                        priceCents: item.priceCents,
                        isActive: true,
                      },
                    ],
                  }))
                }
              >
                Add size or style
              </FormButton>
              {config.groups.map((g, gi) => (
                <section
                  key={g.id}
                  className="grid gap-3 rounded-xl border border-border p-4"
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      label={<>Choice group</>}
                      required
                      maxLength={120}
                      className={field}
                      value={g.name}
                      onChange={(e) =>
                        groupChange(gi, { name: e.target.value })
                      }
                      placeholder="Crust, cheese, toppings…"
                    />
                    <Input
                      label={<>Minimum choices</>}
                      required
                      className={field}
                      type="number"
                      min="0"
                      max="30"
                      value={g.min}
                      onChange={(e) =>
                        groupChange(gi, { min: Number(e.target.value) })
                      }
                    />
                    <Input
                      label={<>Maximum choices</>}
                      required
                      className={field}
                      type="number"
                      min="1"
                      max="30"
                      value={g.max}
                      onChange={(e) =>
                        groupChange(gi, { max: Number(e.target.value) })
                      }
                    />
                  </div>
                  {g.options.map((o, oi) => {
                    const change = (patch: Partial<typeof o>) =>
                      groupChange(gi, {
                        options: g.options.map((x, i) =>
                          i === oi ? { ...x, ...patch } : x,
                        ),
                      });
                    return (
                      <div
                        key={o.id}
                        className="grid gap-2 rounded-lg bg-background p-3"
                      >
                        <div className="grid gap-2 md:grid-cols-3">
                          <Input
                            label={<>Option</>}
                            required
                            maxLength={120}
                            className={field}
                            value={o.name}
                            onChange={(e) => change({ name: e.target.value })}
                          />
                          <Input
                            label={<>Extra price (€)</>}
                            required
                            className={field}
                            type="number"
                            min="0"
                            max="10000"
                            step="0.01"
                            value={o.priceCents / 100}
                            onChange={(e) =>
                              change({
                                priceCents: Math.round(
                                  Number(e.target.value) * 100,
                                ),
                              })
                            }
                          />
                          <Input
                            label={<> Available</>}
                            wrapperClassName="self-center"
                            type="checkbox"
                            checked={o.isActive}
                            onChange={(e) =>
                              change({ isActive: e.target.checked })
                            }
                          />
                        </div>
                        <Fieldset>
                          <Fieldset.Legend className="text-xs text-muted">
                            Allowed sizes · leave all unchecked to allow every
                            size
                          </Fieldset.Legend>
                          <div className="flex flex-wrap gap-3">
                            {config.variants.map((v) => (
                              <Input
                                label={<> {v.name || "Unnamed size"}</>}
                                key={v.id}
                                type="checkbox"
                                checked={o.variantIds.includes(v.id)}
                                onChange={(e) =>
                                  change({
                                    variantIds: e.target.checked
                                      ? [...o.variantIds, v.id]
                                      : o.variantIds.filter(
                                          (id) => id !== v.id,
                                        ),
                                  })
                                }
                              />
                            ))}
                          </div>
                        </Fieldset>
                        <details>
                          <summary className="cursor-pointer text-sm">
                            Different extra price by size
                          </summary>
                          <div className="mt-2 grid gap-2 md:grid-cols-3">
                            {config.variants.map((v) => (
                              <Input
                                label={<>{v.name}(€)</>}
                                key={v.id}
                                className={field}
                                type="number"
                                min="0"
                                max="10000"
                                step="0.01"
                                placeholder="Use default price"
                                value={
                                  o.priceOverrides?.find(
                                    (p) => p.variantId === v.id,
                                  )?.priceCents === undefined
                                    ? ""
                                    : o.priceOverrides!.find(
                                        (p) => p.variantId === v.id,
                                      )!.priceCents / 100
                                }
                                onChange={(e) =>
                                  change({
                                    priceOverrides: [
                                      ...(o.priceOverrides ?? []).filter(
                                        (p) => p.variantId !== v.id,
                                      ),
                                      ...(e.target.value === ""
                                        ? []
                                        : [
                                            {
                                              variantId: v.id,
                                              priceCents: Math.round(
                                                Number(e.target.value) * 100,
                                              ),
                                            },
                                          ]),
                                    ],
                                  })
                                }
                              />
                            ))}
                          </div>
                        </details>
                        <FormButton
                          variant="ghost"
                          type="button"
                          className={action}
                          onPress={() =>
                            groupChange(gi, {
                              options: g.options.filter((x) => x.id !== o.id),
                            })
                          }
                        >
                          Remove option
                        </FormButton>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <FormButton
                      variant="ghost"
                      type="button"
                      className={action}
                      isDisabled={g.options.length >= 30}
                      onPress={() =>
                        groupChange(gi, {
                          options: [
                            ...g.options,
                            {
                              id: uid(),
                              name: "",
                              priceCents: 0,
                              isActive: true,
                              variantIds: [],
                            },
                          ],
                        })
                      }
                    >
                      Add option
                    </FormButton>
                    <FormButton
                      variant="ghost"
                      type="button"
                      className={action}
                      onPress={() =>
                        setConfig((c) => ({
                          ...c,
                          groups: c.groups.filter((x) => x.id !== g.id),
                        }))
                      }
                    >
                      Remove group
                    </FormButton>
                  </div>
                </section>
              ))}
              <FormButton
                variant="ghost"
                type="button"
                className={action}
                isDisabled={config.groups.length >= 20}
                onPress={() =>
                  setConfig((c) => ({
                    ...c,
                    groups: [
                      ...c.groups,
                      { id: uid(), name: "", min: 0, max: 1, options: [] },
                    ],
                  }))
                }
              >
                Add choice group
              </FormButton>
            </>
          )}
          <details>
            <summary className="cursor-pointer font-semibold">
              Images and custom information
            </summary>
            <div className="mt-3 grid gap-3">
              <TextArea
                label={<>Gallery image URLs · one per line</>}
                className={field}
                value={presentation.gallery.join("\n")}
                onChange={(e) =>
                  setPresentation((p) => ({
                    ...p,
                    gallery: e.target.value.split("\n"),
                  }))
                }
              />
              {presentation.fields.map((f, i) => {
                const change = (patch: Partial<typeof f>) =>
                  setPresentation((p) => ({
                    ...p,
                    fields: p.fields.map((x, j) =>
                      j === i ? { ...x, ...patch } : x,
                    ),
                  }));
                return (
                  <div
                    key={i}
                    className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-2"
                  >
                    <Input
                      label={<>Field name</>}
                      required
                      className={field}
                      value={f.name}
                      onChange={(e) => change({ name: e.target.value })}
                    />
                    <Select
                      label={<>Type</>}
                      className={field}
                      value={f.type}
                      onChange={(e) =>
                        change({
                          type: e.target.value as typeof f.type,
                          value: e.target.value === "boolean" ? "false" : "",
                        })
                      }
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Yes / No</option>
                    </Select>
                    <label>
                      Value
                      {f.type === "boolean" ? (
                        <Select
                          className={field}
                          value={f.value}
                          onChange={(e) => change({ value: e.target.value })}
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </Select>
                      ) : (
                        <Input
                          required
                          className={field}
                          type={f.type === "number" ? "number" : "text"}
                          step="any"
                          value={f.value}
                          onChange={(e) => change({ value: e.target.value })}
                        />
                      )}
                    </label>
                    <Select
                      label={<>Visibility</>}
                      className={field}
                      value={f.visibility}
                      onChange={(e) =>
                        change({
                          visibility: e.target.value as typeof f.visibility,
                        })
                      }
                    >
                      <option value="internal">Internal only</option>
                      <option value="public">Visible to customers</option>
                    </Select>
                    <FormButton
                      variant="ghost"
                      type="button"
                      className={action}
                      onPress={() =>
                        setPresentation((p) => ({
                          ...p,
                          fields: p.fields.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      Remove field
                    </FormButton>
                  </div>
                );
              })}
              <FormButton
                variant="ghost"
                type="button"
                className={action}
                isDisabled={presentation.fields.length >= 40}
                onPress={() =>
                  setPresentation((p) => ({
                    ...p,
                    fields: [
                      ...p.fields,
                      {
                        name: "",
                        type: "text",
                        value: "",
                        visibility: "internal",
                      },
                    ],
                  }))
                }
              >
                Add custom field
              </FormButton>
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold">
              Pizza availability schedule
            </summary>
            <div className="mt-3 grid gap-3">
              <Input
                label={<> Restrict ordering to these hours</>}
                type="checkbox"
                checked={presentation.availability.enabled}
                onChange={(e) =>
                  setPresentation((p) => ({
                    ...p,
                    availability: {
                      ...p.availability,
                      enabled: e.target.checked,
                    },
                  }))
                }
              />
              <Input
                label={<>Timezone</>}
                required
                className={field}
                value={presentation.availability.timezone}
                onChange={(e) =>
                  setPresentation((p) => ({
                    ...p,
                    availability: {
                      ...p.availability,
                      timezone: e.target.value,
                    },
                  }))
                }
              />
              {presentation.availability.periods.map((period, i) => {
                const change = (patch: Partial<typeof period>) =>
                  setPresentation((p) => ({
                    ...p,
                    availability: {
                      ...p.availability,
                      periods: p.availability.periods.map((x, j) =>
                        i === j ? { ...x, ...patch } : x,
                      ),
                    },
                  }));
                return (
                  <div key={i} className="flex flex-wrap gap-2">
                    <Select
                      label={<>Day</>}
                      className={field}
                      value={period.day}
                      onChange={(e) => change({ day: Number(e.target.value) })}
                    >
                      {[
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ].map((day, index) => (
                        <option key={day} value={index}>
                          {day}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label={<>From</>}
                      required
                      className={field}
                      type="time"
                      value={period.opens}
                      onChange={(e) => change({ opens: e.target.value })}
                    />
                    <Input
                      label={<>Until</>}
                      required
                      className={field}
                      type="text"
                      placeholder="24:00"
                      value={period.closes}
                      onChange={(e) => change({ closes: e.target.value })}
                    />
                    <FormButton
                      variant="ghost"
                      type="button"
                      className={action}
                      onPress={() =>
                        setPresentation((p) => ({
                          ...p,
                          availability: {
                            ...p.availability,
                            periods: p.availability.periods.filter(
                              (_, j) => i !== j,
                            ),
                          },
                        }))
                      }
                    >
                      Remove period
                    </FormButton>
                  </div>
                );
              })}
              <FormButton
                variant="ghost"
                type="button"
                className={action}
                onPress={() =>
                  setPresentation((p) => ({
                    ...p,
                    availability: {
                      ...p.availability,
                      periods: [
                        ...p.availability.periods,
                        { day: 1, opens: "11:00", closes: "22:00" },
                      ],
                    },
                  }))
                }
              >
                Add ordering period
              </FormButton>
              <Input
                label={<>Closed dates · YYYY-MM-DD, separated by commas</>}
                className={field}
                value={presentation.availability.closedDates.join(",")}
                onChange={(e) =>
                  setPresentation((p) => ({
                    ...p,
                    availability: {
                      ...p.availability,
                      closedDates: e.target.value.split(","),
                    },
                  }))
                }
              />
              <p className="text-sm text-muted">
                An enabled schedule with no periods makes this pizza
                unavailable. Split overnight periods at midnight.
              </p>
            </div>
          </details>
          {enabled && (
            <details>
              <summary className="cursor-pointer font-semibold">
                Customer preview
              </summary>
              <div className="mt-3 rounded-3xl bg-accent p-5 text-accent-foreground">
                <h3 className="text-xl font-bold">{item.name}</h3>
                <p>{description}</p>
                <FormScope>
                  <PizzaChoices
                    config={config}
                    variantId={
                      previewVariant ||
                      config.variants.find((v) => v.isActive)?.id ||
                      ""
                    }
                    selections={previewSelections}
                    onChange={(id, values) => {
                      setPreviewVariant(id);
                      setPreviewSelections(values);
                    }}
                  />
                </FormScope>
              </div>
            </details>
          )}
          <details>
            <summary className="cursor-pointer font-semibold">
              Kitchen recipe and quality controls
            </summary>
            <div className="mt-3 grid gap-3">
              {recipe.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    label={<>Ingredient</>}
                    wrapperClassName="flex-1"
                    required
                    className={field}
                    value={r.name}
                    onChange={(e) =>
                      setRecipe((rows) =>
                        rows.map((x, j) =>
                          i === j ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    label={<>Grams</>}
                    required
                    className={field}
                    type="number"
                    min="0"
                    value={r.weightGrams}
                    onChange={(e) =>
                      setRecipe((rows) =>
                        rows.map((x, j) =>
                          i === j
                            ? { ...x, weightGrams: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                  <FormButton
                    variant="ghost"
                    type="button"
                    className={action}
                    onPress={() =>
                      setRecipe((rows) => rows.filter((_, j) => j !== i))
                    }
                  >
                    Remove
                  </FormButton>
                </div>
              ))}
              <FormButton
                variant="ghost"
                type="button"
                className={action}
                onPress={() =>
                  setRecipe((rows) => [...rows, { name: "", weightGrams: 0 }])
                }
              >
                Add recipe ingredient
              </FormButton>
              <Input
                label={<>Cook time (seconds)</>}
                className={field}
                type="number"
                min="0"
                value={cookTimeSeconds}
                onChange={(e) => setCookTime(Number(e.target.value))}
              />
              <Input
                label={<>Handoff temperature (°C)</>}
                className={field}
                type="number"
                value={handoffTempC}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
              <Input
                label={<> Require numbered seal</>}
                type="checkbox"
                checked={requiresNumberedSeal}
                onChange={(e) => setSeal(e.target.checked)}
              />
              <Input
                label={<> Require ready photo</>}
                type="checkbox"
                checked={requiresReadyPhoto}
                onChange={(e) => setPhoto(e.target.checked)}
              />
              <TextArea
                label={<>Quality checks · one per line</>}
                className={field}
                value={checks}
                onChange={(e) => setChecks(e.target.value)}
              />
            </div>
          </details>
          <FormButton
            variant="ghost"
            type="submit"
            className="rounded-xl bg-accent p-3 font-semibold text-accent-foreground"
          >
            {busy ? "Saving…" : "Save pizza configuration"}
          </FormButton>
        </Fieldset>
        {message && <p role="status">{message}</p>}
      </Form>
    </details>
  );
}

export function MenuCategoryEditor({
  category,
  onSaved,
}: {
  category: Category;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(category.name);
  const [order, setOrder] = useState(category.sortOrder);
  const [active, setActive] = useState(category.isActive !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Form
      className="my-2 flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await apiRequest(`/api/v1/catalog/categories/${category.id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${requireAdminToken()}` },
            body: { name, sortOrder: order, isActive: active },
          });
          await onSaved();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Save failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input
        aria-label="Category name"
        required
        maxLength={120}
        className={field + " max-w-56"}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        aria-label="Category display order"
        type="number"
        className={field + " max-w-24"}
        value={order}
        onChange={(e) => setOrder(Number(e.target.value))}
      />
      <Input
        label={<> Visible</>}
        type="checkbox"
        checked={active}
        onChange={(e) => setActive(e.target.checked)}
      />
      <FormButton
        variant="ghost"
        type="submit"
        isDisabled={busy}
        className={action}
      >
        Save category
      </FormButton>
      {error && <p role="alert">{error}</p>}
    </Form>
  );
}
