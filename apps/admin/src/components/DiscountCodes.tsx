"use client";
import { FormValue } from "@repo/ui/forms";
import { couponSchema } from "@repo/ui/form-schemas";
import { Form, Input, Select } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { apiRequest } from "@repo/api";
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
};
export function DiscountCodes() {
  const [rows, setRows] = useState<Coupon[]>([]);
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
  });
  const load = useCallback(async () => {
    try {
      setRows(
        await apiRequest<Coupon[]>("/api/v1/growth/coupons", {
          headers: { Authorization: `Bearer ${requireAdminToken()}` },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
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
              },
            });
            setForm((f) => ({ ...f, code: "", name: "" }));
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
