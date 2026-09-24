"use client";
import { FormValue } from "@repo/ui/forms";
import { couponSchema } from "@repo/ui/form-schemas";
import { Form, Input, Select } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { apiRequest, catalogClient, type PublishedMenuItem } from "@repo/api";
import { useCallback, useEffect, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
type Coupon = {
  _id: string;
  code: string;
  name: string;
  active: boolean;
  kind: "fixed" | "percent";
  value: number;
  endAt: string;
  userScope?: "all" | "specific";
  eligibleUserIds?: string[];
  productScope?: "all" | "specific";
  eligibleProductIds?: string[];
  minimumEligibleQuantity?: number;
};
type CustomerTarget = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};
export function DiscountCodes() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<CustomerTarget[]>([]);
  const [products, setProducts] = useState<PublishedMenuItem[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    kind: "percent",
    value: "10",
    minimum: "0",
    cap: "10",
    start: "",
    end: "",
    userScope: "all" as "all" | "specific",
    eligibleUserIds: [] as string[],
    productScope: "all" as "all" | "specific",
    eligibleProductIds: [] as string[],
    minimumEligibleQuantity: "1",
  });
  const load = useCallback(async () => {
    try {
      const token = requireAdminToken();
      const [couponRows, customerRows, menu] = await Promise.all([
        apiRequest<Coupon[]>("/api/v1/growth/coupons", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest<CustomerTarget[]>(
          "/api/v1/growth/coupon-targets/customers",
          {
            headers: { Authorization: `Bearer ${requireAdminToken()}` },
          },
        ),
        catalogClient.getPublishedMenu(),
      ]);
      setRows(couponRows);
      setCustomers(customerRows);
      setProducts(menu.items.filter((item) => !!item.productId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const searchCustomers = async () => {
    setError("");
    try {
      setCustomers(
        await apiRequest<CustomerTarget[]>(
          `/api/v1/growth/coupon-targets/customers?q=${encodeURIComponent(customerQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${requireAdminToken()}`,
            },
          },
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Customer search failed.");
    }
  };
  const field = "mt-1 w-full rounded-xl border border-border bg-background p-3";
  return (
    <section className="space-y-4 rounded-3xl border border-border p-5">
      <h2 className="text-xl font-semibold">Discount codes</h2>
      <p className="text-sm text-muted">
        One code per order. Discounts apply to the pizza subtotal, with a cap
        per order. These codes can be reused while active.
      </p>
      <Form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await apiRequest("/api/v1/growth/coupons", {
              method: "POST",
              headers: { Authorization: `Bearer ${requireAdminToken()}` },
              body: {
                code: form.code.trim().toUpperCase(),
                name: form.name,
                kind: form.kind,
                value:
                  form.kind === "percent"
                    ? Number(form.value)
                    : Math.round(Number(form.value) * 100),
                minSubtotalCents: Math.round(Number(form.minimum) * 100),
                maxDiscountCents: Math.round(Number(form.cap) * 100),
                startAt: new Date(form.start).toISOString(),
                endAt: new Date(form.end).toISOString(),
                userScope: form.userScope,
                eligibleUserIds:
                  form.userScope === "specific" ? form.eligibleUserIds : [],
                productScope: form.productScope,
                eligibleProductIds:
                  form.productScope === "specific"
                    ? form.eligibleProductIds
                    : [],
                minimumEligibleQuantity: Number(form.minimumEligibleQuantity),
              },
            });
            setForm((f) => ({
              ...f,
              code: "",
              name: "",
              eligibleUserIds: [],
              eligibleProductIds: [],
            }));
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Create failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <FormValue name="discount" value={form} schema={couponSchema} />
        <Input
          label={<>Code</>}
          required
          pattern="[A-Z0-9-]{3,32}"
          className={field}
          value={form.code}
          onChange={(e) =>
            setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
          }
        />
        <Input
          label={<>Internal name</>}
          required
          minLength={3}
          className={field}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Select
          label={<>Discount type</>}
          className={field}
          value={form.kind}
          onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
        >
          <option value="percent">Percentage</option>
          <option value="fixed">Fixed amount (€)</option>
        </Select>
        <Input
          label={<>{form.kind === "percent" ? "Percentage" : "Amount (€)"}</>}
          required
          type="number"
          min={form.kind === "percent" ? 1 : 0.01}
          max={form.kind === "percent" ? 100 : 10000}
          step={form.kind === "percent" ? 1 : 0.01}
          className={field}
          value={form.value}
          onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
        />
        <Input
          label={<>Minimum pizza subtotal (€)</>}
          required
          type="number"
          min="0"
          step="0.01"
          className={field}
          value={form.minimum}
          onChange={(e) => setForm((f) => ({ ...f, minimum: e.target.value }))}
        />
        <Input
          label={<>Maximum discount per order (€)</>}
          required
          type="number"
          min="0.01"
          step="0.01"
          className={field}
          value={form.cap}
          onChange={(e) => setForm((f) => ({ ...f, cap: e.target.value }))}
        />
        <Input
          label={<>Starts (local time)</>}
          required
          type="datetime-local"
          className={field}
          value={form.start}
          onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
        />
        <Input
          label={<>Ends (local time)</>}
          required
          type="datetime-local"
          className={field}
          value={form.end}
          onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
        />
        <Select
          label={<>Customers</>}
          className={field}
          value={form.userScope}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              userScope: e.target.value as "all" | "specific",
            }))
          }
        >
          <option value="all">All customers</option>
          <option value="specific">Selected customers only</option>
        </Select>
        <Select
          label={<>Products</>}
          className={field}
          value={form.productScope}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              productScope: e.target.value as "all" | "specific",
            }))
          }
        >
          <option value="all">All products</option>
          <option value="specific">Selected products only</option>
        </Select>
        {form.userScope === "specific" && (
          <fieldset className="rounded-xl border border-border p-3 md:col-span-2">
            <legend className="px-1 text-sm font-semibold">
              Eligible customers
            </legend>
            <div className="mt-2 flex gap-2">
              <Input
                label={<>Search by name, email or phone</>}
                className={field}
                value={customerQuery}
                onChange={(event) => setCustomerQuery(event.target.value)}
              />
              <FormButton
                type="button"
                variant="ghost"
                className="self-end rounded-xl border border-border px-4 py-3"
                onPress={() => void searchCustomers()}
              >
                Search
              </FormButton>
            </div>
            <div className="mt-2 grid max-h-56 gap-2 overflow-y-auto md:grid-cols-2">
              {customers.map((customer) => (
                <label key={customer.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.eligibleUserIds.includes(customer.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        eligibleUserIds: event.target.checked
                          ? [...current.eligibleUserIds, customer.id]
                          : current.eligibleUserIds.filter(
                              (id) => id !== customer.id,
                            ),
                      }))
                    }
                  />
                  <span>
                    <strong>{customer.name}</strong>
                    <small className="block text-muted">
                      {customer.email || customer.phone || customer.id}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {form.productScope === "specific" && (
          <fieldset className="rounded-xl border border-border p-3 md:col-span-2">
            <legend className="px-1 text-sm font-semibold">
              Eligible products
            </legend>
            <div className="mt-2 grid max-h-56 gap-2 overflow-y-auto md:grid-cols-2">
              {products.map((product) => (
                <label key={product.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.eligibleProductIds.includes(
                      product.productId!,
                    )}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        eligibleProductIds: event.target.checked
                          ? [...current.eligibleProductIds, product.productId!]
                          : current.eligibleProductIds.filter(
                              (id) => id !== product.productId,
                            ),
                      }))
                    }
                  />
                  <span>
                    <strong>{product.name}</strong>
                    <small className="block text-muted">
                      €{(product.priceCents / 100).toFixed(2)}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Input
          label={<>Minimum eligible product quantity</>}
          required
          type="number"
          min="1"
          max="99"
          step="1"
          className={field}
          value={form.minimumEligibleQuantity}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              minimumEligibleQuantity: e.target.value,
            }))
          }
        />
        <FormButton
          variant="ghost"
          type="submit"
          isDisabled={busy}
          className="rounded-xl bg-accent p-3 font-semibold text-accent-foreground disabled:opacity-50"
        >
          Create discount code
        </FormButton>
      </Form>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {rows.map((row) => (
        <div
          key={row._id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3"
        >
          <div>
            <strong>{row.code}</strong>
            <p className="text-sm">
              {row.name} ·{" "}
              {row.kind === "percent"
                ? `${row.value}%`
                : `€${(row.value / 100).toFixed(2)}`}{" "}
              · {row.active ? "Active" : "Paused"}
            </p>
            <p className="text-xs text-muted">
              {row.userScope === "specific"
                ? `${row.eligibleUserIds?.length ?? 0} selected customer(s)`
                : "All customers"}
              {" · "}
              {row.productScope === "specific"
                ? `${row.eligibleProductIds?.length ?? 0} selected product(s)`
                : "All products"}
              {" · minimum quantity "}
              {row.minimumEligibleQuantity ?? 1}
            </p>
          </div>
          <FormButton
            variant="ghost"
            type="button"
            isDisabled={busy}
            className="underline"
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await apiRequest(`/api/v1/growth/coupons/${row._id}`, {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${requireAdminToken()}` },
                  body: { active: !row.active },
                });
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Update failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {row.active ? "Pause" : "Activate"}
          </FormButton>
        </div>
      ))}
    </section>
  );
}
